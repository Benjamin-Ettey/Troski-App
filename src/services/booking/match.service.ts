import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import Booking from "../../models/Booking";
import { ServiceResponse } from "../auth/local/auth.service";
import type { BookingStatus } from "../../types/booking.types";
import { findNearbyRuns } from "../driver/run.service";
import {
  resolveTown,
  nearestTown,
  haversineKm,
} from "../../utils/locationLookup";
import {
  decodePolyline,
  nearestPointOnPath,
  type Point,
} from "../../utils/polyline";
import { calculateRouteFare } from "../fare/fare.service";
import { recordDemand, runClustering } from "./demand.service";
import zonesConfig from "../../data/zonesConfig";
import { publish } from "../realtime/sse";

const SEARCH_RADIUS_KM = 5;
const DEST_CORRIDOR_KM = Number(process.env.MATCH_DEST_CORRIDOR_KM || 1.5);
const URBAN_SPEED_KMH = 25;
const WALK_SPEED_KMH = 5;
const READY_BUFFER_MIN = Number(process.env.MATCH_READY_BUFFER_MIN || 2);
const MAX_WAIT_MIN = Number(process.env.MATCH_MAX_WAIT_MIN || 10);
const ACTIVE_STATUSES: BookingStatus[] = [
  "requested",
  "accepted",
  "arrived",
  "in_progress",
];

type Coord = { lat: number; lng: number };

export const bookingDeclinesCache = new Map<string, Set<string>>();

const computePickupPoint = (run: any, lat: number, lng: number): Coord => {
  if (run.routePolyline) {
    const path = decodePolyline(run.routePolyline);
    const nearest = nearestPointOnPath(path, lat, lng);
    if (nearest) return { lat: nearest.point.lat, lng: nearest.point.lng };
  }
  return { lat, lng };
};

const vanPosition = (run: any): Coord => ({
  lng: run.currentLocation.coordinates[0],
  lat: run.currentLocation.coordinates[1],
});

export const assessCorridor = (
  path: Point[],
  van: Coord | null,
  pickup: Coord,
  dest: Coord,
  corridorKm: number = DEST_CORRIDOR_KM,
): { serves: boolean; pickupPoint?: Coord } => {
  const p = nearestPointOnPath(path, pickup.lat, pickup.lng);
  const d = nearestPointOnPath(path, dest.lat, dest.lng);
  if (!p || !d) return { serves: false };

  const destOnRoute = d.distanceKm <= corridorKm;
  const forward = d.index > p.index;
  const vanProj = van ? nearestPointOnPath(path, van.lat, van.lng) : null;
  const vanNotPast = vanProj ? vanProj.index <= p.index : true;

  return {
    serves: destOnRoute && forward && vanNotPast,
    pickupPoint: { lat: p.point.lat, lng: p.point.lng },
  };
};

const servesCorridor = (
  run: any,
  pickup: Coord,
  dest: Coord,
  passengerDestZone: string,
): { serves: boolean; pickupPoint?: Coord } => {
  if (run.routePolyline) {
    return assessCorridor(
      decodePolyline(run.routePolyline),
      vanPosition(run),
      pickup,
      dest,
    );
  }
  return { serves: run.destination?.zoneId === passengerDestZone };
};

// Simplified to exactly match your straight-line distance preference
const etaToPickup = (run: any, pickup: Coord): number => {
  const van = vanPosition(run);
  const km = haversineKm(van.lat, van.lng, pickup.lat, pickup.lng);
  return Math.max(1, Math.round((km / URBAN_SPEED_KMH) * 60));
};

export const assessTiming = (
  walkEta: number,
  vanEta: number,
  bufferMin: number = READY_BUFFER_MIN,
  maxWaitMin: number = MAX_WAIT_MIN,
): { readyIn: number; waitMin: number; feasible: boolean } => {
  const readyIn = walkEta + bufferMin;
  const waitMin = Math.max(0, vanEta - readyIn);
  const feasible = readyIn <= vanEta && waitMin <= maxWaitMin;
  return { readyIn, waitMin, feasible };
};

// Simplified to exactly match your straight-line distance preference
const walkingEta = (from: Coord, to: Coord): number => {
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
  return Math.max(1, Math.round((km / WALK_SPEED_KMH) * 60));
};

export const evaluateCandidates = async (
  candidates: any[],
  passenger: Coord,
  passengerDest: Coord,
  destinationZoneId: string,
) => {
  const evaluated = candidates
    .map((run) => {
      const corridor = servesCorridor(
        run,
        passenger,
        passengerDest,
        destinationZoneId,
      );
      if (!corridor.serves) return null;

      const pickup =
        corridor.pickupPoint ??
        computePickupPoint(run, passenger.lat, passenger.lng);

      const vanEta = etaToPickup(run, pickup);
      const walkEta = walkingEta(passenger, pickup);

      const { readyIn, waitMin, feasible } = assessTiming(
        walkEta,
        vanEta,
        READY_BUFFER_MIN,
        MAX_WAIT_MIN,
      );
      return { run, pickup, vanEta, walkEta, readyIn, waitMin, feasible };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const viable = evaluated.filter((e) => e.feasible);
  viable.sort((a, b) => a.vanEta - b.vanEta || a.waitMin - b.waitMin);
  return viable;
};

export const findNextBestDriver = async (
  booking: any,
  excludedDriverIds: Set<string>,
) => {
  const candidates = await findNearbyRuns({
    lat: booking.pickup.latitude,
    lng: booking.pickup.longitude,
    minSeats: booking.seatsRequested,
    radiusKm: SEARCH_RADIUS_KM,
  });

  const filteredCandidates = candidates.filter(
    (run) => !excludedDriverIds.has(String(run.driver)),
  );

  if (!filteredCandidates.length) return null;

  const passenger: Coord = {
    lat: booking.pickup.latitude,
    lng: booking.pickup.longitude,
  };
  const passengerDest: Coord = {
    lat: booking.destination.latitude,
    lng: booking.destination.longitude,
  };

  const viable = await evaluateCandidates(
    filteredCandidates,
    passenger,
    passengerDest,
    booking.destination.zoneId,
  );

  return viable.length > 0 ? viable[0] : null;
};

export const matchRideService = async (
  passengerId: Types.ObjectId,
  payload: {
    pickupLat: number;
    pickupLng: number;
    destLat?: number;
    destLng?: number;
    destinationTown?: string;
    seats: number;
    paymentMethod: "cash" | "momo";
  },
): Promise<ServiceResponse> => {
  // 1. Enforce exact alignment with EstimateFareService
  const pickupTown = nearestTown(payload.pickupLat, payload.pickupLng);

  let dropoffLat = payload.destLat;
  let dropoffLng = payload.destLng;
  let dropoffTown;

  if (dropoffLat != null && dropoffLng != null) {
    dropoffTown = nearestTown(dropoffLat, dropoffLng);
  } else if (payload.destinationTown) {
    dropoffTown = resolveTown(payload.destinationTown);
    if (dropoffTown) {
      dropoffLat = dropoffTown.latitude;
      dropoffLng = dropoffTown.longitude;
    }
  }

  if (!pickupTown || !dropoffTown || dropoffLat == null || dropoffLng == null) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Valid pickup and destination coordinates are required.",
    };
  }

  if (pickupTown.town === dropoffTown.town) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Pickup and destination cannot be the same.",
    };
  }

  const existing = await Booking.findOne({
    passenger: passengerId,
    status: { $in: ACTIVE_STATUSES },
  });
  if (existing)
    return {
      status: StatusCodes.CONFLICT,
      message: "You already have an active ride.",
    };

  const candidates = await findNearbyRuns({
    lat: payload.pickupLat,
    lng: payload.pickupLng,
    minSeats: payload.seats,
    radiusKm: SEARCH_RADIUS_KM,
  });

  const registerUnmetDemand = async (
    message: string,
  ): Promise<ServiceResponse> => {
    const demand = await recordDemand(
      passengerId,
      {
        lat: payload.pickupLat,
        lng: payload.pickupLng,
        zoneId: pickupTown.zoneId,
      },
      dropoffTown,
      payload.seats,
    );
    await runClustering();
    return {
      status: StatusCodes.NOT_FOUND,
      message,
      data: { demandId: demand._id },
    };
  };

  if (!candidates.length)
    return registerUnmetDemand(
      `No trotro heading to ${dropoffTown.town} near you right now.`,
    );

  const passenger: Coord = { lat: payload.pickupLat, lng: payload.pickupLng };
  const passengerDest: Coord = { lat: dropoffLat, lng: dropoffLng };

  const viable = await evaluateCandidates(
    candidates,
    passenger,
    passengerDest,
    dropoffTown.zoneId,
  );

  if (!viable.length)
    return registerUnmetDemand(
      `Cannot reach boarding point before available trotros pass.`,
    );

  const chosen = viable[0];

  // 2. Exact same distance calculation directly from the payload request
  const distanceKm = haversineKm(
    payload.pickupLat,
    payload.pickupLng,
    dropoffLat,
    dropoffLng,
  );

  const fare = calculateRouteFare({
    pickupZone: pickupTown.zoneId,
    dropoffZone: dropoffTown.zoneId,
    distanceInKm: distanceKm,
    zonesConfig,
    seats: payload.seats,
  });

  const total = fare.finalFare;
  const pickupName = pickupTown.town;

  const booking = await Booking.create({
    passenger: passengerId,
    run: chosen.run._id,
    driver: chosen.run.driver,
    vehicle: chosen.run.vehicle ?? null,
    pickup: {
      town: pickupName,
      zoneId: pickupTown.zoneId,
      latitude: chosen.pickup.lat, // Boarding point for the driver
      longitude: chosen.pickup.lng,
    },
    destination: {
      town: dropoffTown.town,
      zoneId: dropoffTown.zoneId,
      latitude: dropoffLat,
      longitude: dropoffLng,
    },
    pickupPoint: {
      name: pickupName,
      latitude: chosen.pickup.lat, // Boarding point for the driver
      longitude: chosen.pickup.lng,
    },
    distanceKm: fare.distanceInKm, // Perfect match to estimate
    seatsRequested: payload.seats,
    fareEstimate: total, // Perfect match to estimate
    etaMinutes: chosen.vanEta,
    walkMinutes: chosen.walkEta,
    waitMinutes: chosen.waitMin,
    paymentMethod: payload.paymentMethod,
    status: "requested",
  });

  publish(`driver_${chosen.run.driver}`, "new_booking_offer", {
    bookingId: booking._id,
    pickupPoint: booking.pickupPoint,
    readyInMinutes: chosen.readyIn,
    waitMinutes: chosen.waitMin,
  });

  const isLocked = payload.paymentMethod === "momo";
  let responseBooking = booking.toObject();
  let responsePickupPoint = { name: pickupName, ...chosen.pickup };

  if (isLocked) {
    delete responseBooking.driver;
    delete responseBooking.vehicle;
    delete responseBooking.run;
    if (responseBooking.pickupPoint) {
      delete responseBooking.pickupPoint.latitude;
      delete responseBooking.pickupPoint.longitude;
    }
    responsePickupPoint = { name: pickupName } as any;
  }

  return {
    status: StatusCodes.CREATED,
    message: isLocked
      ? "Request sent. Complete payment to unlock exact boarding point and driver details."
      : `Request sent to driver. Walk to ${pickupName} (~${chosen.walkEta} min).`,
    data: {
      booking: responseBooking,
      pickupPoint: responsePickupPoint,
      etaMinutes: chosen.vanEta,
      walkMinutes: chosen.walkEta,
      readyInMinutes: chosen.readyIn,
      waitMinutes: chosen.waitMin,
      fare: { total, ...fare },
    },
  };
};
