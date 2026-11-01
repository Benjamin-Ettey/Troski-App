import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import Booking from "../../models/Booking";
import { ServiceResponse } from "../auth/local/auth.service";
import type { BookingStatus } from "../../types/booking.types";
import { findNearbyRuns } from "../driver/run.service";
import {
  resolvePlace,
  nearestTown,
  haversineKm,
} from "../../utils/locationLookup";
import {
  decodePolyline,
  nearestPointOnPath,
  type Point,
} from "../../utils/polyline";
import { mapsService } from "../maps/maps.service";
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

const etaToPickup = async (run: any, pickup: Coord): Promise<number> => {
  const van = vanPosition(run);
  try {
    const r = await mapsService.getRoadDistance(van, pickup);
    return r.durationMin;
  } catch {
    const km = haversineKm(van.lat, van.lng, pickup.lat, pickup.lng);
    return Math.max(1, Math.round((km / URBAN_SPEED_KMH) * 60));
  }
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

const walkingEta = async (from: Coord, to: Coord): Promise<number> => {
  try {
    const r = await mapsService.computeRoute(from, to, "WALK");
    return r.durationMin;
  } catch {
    const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
    return Math.max(1, Math.round((km / WALK_SPEED_KMH) * 60));
  }
};

const nameForPoint = async (point: Coord): Promise<string> => {
  try {
    const r = await mapsService.reverseGeocode(point);
    return r.formattedAddress;
  } catch {
    return nearestTown(point.lat, point.lng)?.town ?? "Pickup point";
  }
};

export const evaluateCandidates = async (
  candidates: any[],
  passenger: Coord,
  passengerDest: Coord,
  destinationZoneId: string,
) => {
  const evaluated = (
    await Promise.all(
      candidates.map(async (run) => {
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
        const [vanEta, walkEta] = await Promise.all([
          etaToPickup(run, pickup),
          walkingEta(passenger, pickup),
        ]);

        const { readyIn, waitMin, feasible } = assessTiming(
          walkEta,
          vanEta,
          READY_BUFFER_MIN,
          MAX_WAIT_MIN,
        );
        return { run, pickup, vanEta, walkEta, readyIn, waitMin, feasible };
      }),
    )
  ).filter((e): e is NonNullable<typeof e> => e !== null);

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
  const destination = resolvePlace({
    lat: payload.destLat,
    lng: payload.destLng,
    town: payload.destinationTown,
  });
  if (!destination)
    return { status: StatusCodes.BAD_REQUEST, message: "Destination required" };

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
      { lat: payload.pickupLat, lng: payload.pickupLng },
      destination,
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
      `No trotro heading to ${destination.town} near you right now.`,
    );

  const passenger: Coord = { lat: payload.pickupLat, lng: payload.pickupLng };
  const passengerDest: Coord = {
    lat: destination.latitude,
    lng: destination.longitude,
  };

  const viable = await evaluateCandidates(
    candidates,
    passenger,
    passengerDest,
    destination.zoneId,
  );

  if (!viable.length)
    return registerUnmetDemand(
      `Cannot reach boarding point before available trotros pass.`,
    );

  const chosen = viable[0];

  const pickupZone =
    nearestTown(chosen.pickup.lat, chosen.pickup.lng)?.zoneId ??
    destination.zoneId;
  let distanceKm = haversineKm(
    chosen.pickup.lat,
    chosen.pickup.lng,
    destination.latitude,
    destination.longitude,
  );

  try {
    const r = await mapsService.getRoadDistance(chosen.pickup, {
      lat: destination.latitude,
      lng: destination.longitude,
    });
    distanceKm = r.distanceKm;
  } catch {}

  const fare = calculateRouteFare({
    pickupZone,
    dropoffZone: destination.zoneId,
    distanceInKm: distanceKm,
    zonesConfig,
  });
  const total = parseFloat((fare.finalFare * payload.seats).toFixed(2));
  const pickupName = await nameForPoint(chosen.pickup);

  const booking = await Booking.create({
    passenger: passengerId,
    run: chosen.run._id,
    driver: chosen.run.driver,
    vehicle: chosen.run.vehicle ?? null,
    pickup: {
      town: pickupName,
      zoneId: pickupZone,
      latitude: chosen.pickup.lat,
      longitude: chosen.pickup.lng,
    },
    destination: {
      town: destination.town,
      zoneId: destination.zoneId,
      latitude: destination.latitude,
      longitude: destination.longitude,
    },
    pickupPoint: {
      name: pickupName,
      latitude: chosen.pickup.lat,
      longitude: chosen.pickup.lng,
    },
    distanceKm: fare.distanceInKm,
    seatsRequested: payload.seats,
    fareEstimate: total,
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

  // FIX: Properly ensure driver, vehicle, and run properties are fully obscured in memory returned to client
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
