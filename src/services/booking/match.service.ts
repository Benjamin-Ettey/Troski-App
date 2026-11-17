import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import Booking from "../../models/Booking";
import { ServiceResponse } from "../auth/local/auth.service";
import type { BookingStatus } from "../../types/booking.types";
import { findNearbyRuns } from "../driver/run.service";
import { haversineKm } from "../../utils/locationLookup";
import { calculateRouteFare } from "../fare/fare.service";
import { recordDemand, runClustering } from "./demand.service";
import zonesConfig from "../../data/zonesConfig";
import { publish } from "../realtime/sse";

const SEARCH_RADIUS_KM = 5;
const URBAN_SPEED_KMH = 25;
const READY_BUFFER_MIN = Number(process.env.MATCH_READY_BUFFER_MIN || 2);
const MAX_WAIT_MIN = Number(process.env.MATCH_MAX_WAIT_MIN || 15);
const ACTIVE_STATUSES: BookingStatus[] = [
  "requested",
  "accepted",
  "arrived",
  "in_progress",
];

type Coord = { lat: number; lng: number };

export const bookingDeclinesCache = new Map<string, Set<string>>();

const vanPosition = (run: any): Coord => ({
  lng: run.currentLocation.coordinates[0],
  lat: run.currentLocation.coordinates[1],
});

const etaToPickup = (distanceKm: number): number =>
  Math.max(1, Math.round((distanceKm / URBAN_SPEED_KMH) * 60));

export const assessTiming = (
  walkEta: number,
  vanEta: number,
  bufferMin: number = READY_BUFFER_MIN,
  maxWaitMin: number = MAX_WAIT_MIN,
): { readyIn: number; waitMin: number; feasible: boolean } => {
  const effectiveBuffer = walkEta === 0 ? 0 : bufferMin;
  const readyIn = walkEta + effectiveBuffer;
  const waitMin = Math.max(0, vanEta - readyIn);
  const feasible = readyIn <= vanEta && waitMin <= maxWaitMin;
  return { readyIn, waitMin, feasible };
};

export const evaluateCandidates = async (
  candidates: any[],
  passenger: Coord,
) => {
  const evaluated = candidates
    .map((run) => {
      const van = vanPosition(run);
      const distanceToPickupKm = haversineKm(
        van.lat,
        van.lng,
        passenger.lat,
        passenger.lng,
      );

      if (distanceToPickupKm > SEARCH_RADIUS_KM) return null;

      const pickup: Coord = { lat: passenger.lat, lng: passenger.lng };
      const vanEta = etaToPickup(distanceToPickupKm);
      const walkEta = 0;

      const { readyIn, waitMin, feasible } = assessTiming(
        walkEta,
        vanEta,
        READY_BUFFER_MIN,
        MAX_WAIT_MIN,
      );

      return {
        run,
        pickup,
        distanceToPickupKm,
        vanEta,
        walkEta,
        readyIn,
        waitMin,
        feasible,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const viable = evaluated.filter((e) => e.feasible);
  viable.sort(
    (a, b) =>
      a.distanceToPickupKm - b.distanceToPickupKm || a.vanEta - b.vanEta,
  );
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

  const viable = await evaluateCandidates(filteredCandidates, passenger);

  return viable.length > 0 ? viable[0] : null;
};

export const matchRideService = async (
  passengerId: Types.ObjectId,
  payload: {
    pickupLat: number;
    pickupLng: number;
    destLat: number;
    destLng: number;
    seats: number;
    paymentMethod: "cash" | "momo";
  },
): Promise<ServiceResponse> => {
  if (
    payload.pickupLat == null ||
    payload.pickupLng == null ||
    payload.destLat == null ||
    payload.destLng == null
  ) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Pickup and destination coordinates are required.",
    };
  }

  if (
    payload.pickupLat === payload.destLat &&
    payload.pickupLng === payload.destLng
  ) {
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
      },
      {
        latitude: payload.destLat,
        longitude: payload.destLng,
      },
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
    return registerUnmetDemand("No trotro available near you right now.");

  const passenger: Coord = { lat: payload.pickupLat, lng: payload.pickupLng };

  const viable = await evaluateCandidates(candidates, passenger);

  if (!viable.length)
    return registerUnmetDemand(
      "No nearby trotro can reach your pickup location in time.",
    );

  const chosen = viable[0];

  const distanceKm = haversineKm(
    payload.pickupLat,
    payload.pickupLng,
    payload.destLat,
    payload.destLng,
  );

  const fare = calculateRouteFare({
    pickupZone: "REGIONAL_RURAL",
    dropoffZone: "REGIONAL_RURAL",
    distanceInKm: distanceKm,
    zonesConfig,
    seats: payload.seats,
  });

  const total = fare.finalFare;

  const booking = await Booking.create({
    passenger: passengerId,
    run: chosen.run._id,
    driver: chosen.run.driver,
    vehicle: chosen.run.vehicle ?? null,
    pickup: {
      latitude: chosen.pickup.lat,
      longitude: chosen.pickup.lng,
    },
    destination: {
      latitude: payload.destLat,
      longitude: payload.destLng,
    },
    pickupPoint: {
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
  const responseBooking = booking.toObject();
  let responsePickupPoint: Partial<Coord> | null = { ...chosen.pickup };

  if (isLocked) {
    delete responseBooking.driver;
    delete responseBooking.vehicle;
    delete responseBooking.run;
    if (responseBooking.pickupPoint) {
      delete responseBooking.pickupPoint.latitude;
      delete responseBooking.pickupPoint.longitude;
    }
    responsePickupPoint = null;
  }

  return {
    status: StatusCodes.CREATED,
    message: isLocked
      ? "Request sent. Complete payment to unlock exact boarding point and driver details."
      : `Request sent to driver. Estimated arrival in ~${chosen.vanEta} min.`,
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
