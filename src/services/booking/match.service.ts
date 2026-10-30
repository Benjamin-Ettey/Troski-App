import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import Booking from "../../models/Booking";
import DriverRun from "../../models/DriverRun";
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

const SEARCH_RADIUS_KM = 5;
// How far off the van's route the passenger's destination may be and still count
// as "the route passes there".
const DEST_CORRIDOR_KM = Number(process.env.MATCH_DEST_CORRIDOR_KM || 1.5);
const URBAN_SPEED_KMH = 25; // fallback van ETA speed when maps is unavailable
const WALK_SPEED_KMH = 5; // fallback walking speed
// Safety buffer added to the passenger's walk time before they're "ready".
const READY_BUFFER_MIN = Number(process.env.MATCH_READY_BUFFER_MIN || 2);
// Longest a passenger should wait at the stop after arriving, for a match.
const MAX_WAIT_MIN = Number(process.env.MATCH_MAX_WAIT_MIN || 10);
const ACTIVE_STATUSES: BookingStatus[] = [
  "requested",
  "accepted",
  "arrived",
  "in_progress",
];

type Coord = { lat: number; lng: number };

/**
 * The pickup point is the nearest point on the van's route to the passenger
 * (so the passenger walks to the route). Falls back to the passenger's own
 * location when the run has no route geometry (e.g. no maps key).
 */
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

/**
 * Does a van's route actually serve this trip? Pure, offline-testable. A van
 * qualifies only when, on its decoded route:
 *   - the destination lies within the corridor of the route (route passes there)
 *   - the destination is AHEAD of the pickup (van travels pickup -> dest)
 *   - the van has NOT already passed the pickup point
 * This replaces coarse destination-zone equality (which both over- and
 * under-matched) when route geometry is available.
 */
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
  const forward = d.index > p.index; // destination further along than pickup
  const vanProj = van ? nearestPointOnPath(path, van.lat, van.lng) : null;
  const vanNotPast = vanProj ? vanProj.index <= p.index : true;

  return {
    serves: destOnRoute && forward && vanNotPast,
    pickupPoint: { lat: p.point.lat, lng: p.point.lng },
  };
};

/**
 * Corridor check for a run. Uses the route polyline when present; falls back to
 * destination-zone equality when there's no geometry (e.g. no maps key).
 */
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

/** ETA (minutes) for the van to reach the pickup point — Google, else estimate. */
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

/**
 * Readiness-vs-arrival feasibility: a trotro does not wait, so the passenger
 * must reach the boarding point before the van passes it, and not have to wait
 * too long after arriving.
 *   readyIn = walk time + safety buffer
 *   feasible = readyIn <= vanEta  AND  (vanEta - readyIn) <= maxWait
 */
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

/** Walking ETA (minutes) for the passenger to reach the pickup point. */
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

/**
 * Match a passenger to the best nearby trotro already heading to their
 * destination: find candidate runs, place a pickup point on each route, rank by
 * ETA, reserve a seat atomically, and create the booking.
 */
export const matchRideService = async (
  passengerId: Types.ObjectId,
  payload: {
    pickupLat: number;
    pickupLng: number;
    destLat?: number;
    destLng?: number;
    destinationTown?: string;
    seats: number;
  },
): Promise<ServiceResponse> => {
  // Destination may be a dropped pin (coords) or a town name.
  const destination = resolvePlace({
    lat: payload.destLat,
    lng: payload.destLng,
    town: payload.destinationTown,
  });
  if (!destination) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "A destination (coordinates or town) is required",
    };
  }

  // One active ride per passenger.
  const existing = await Booking.findOne({
    passenger: passengerId,
    status: { $in: ACTIVE_STATUSES },
  });
  if (existing) {
    return {
      status: StatusCodes.CONFLICT,
      message: "You already have an active ride.",
      data: { bookingId: existing._id, status: existing.status },
    };
  }

  // Supply prefilter: vans near the passenger with seats (direction/destination
  // is decided precisely by the corridor check below, not a coarse zone filter).
  const candidates = await findNearbyRuns({
    lat: payload.pickupLat,
    lng: payload.pickupLng,
    minSeats: payload.seats,
    radiusKm: SEARCH_RADIUS_KM,
  });

  // No workable van -> record the demand (so it can be clustered into a new
  // route) and return a no-van response.
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

  if (!candidates.length) {
    return registerUnmetDemand(
      `No trotro heading to ${destination.town} near you right now. We'll alert nearby drivers if more people want this route.`,
    );
  }

  // Evaluate each candidate: (1) does its route actually serve this trip
  // (corridor + direction + not-yet-passed), then (2) can the passenger reach
  // the boarding point before the van passes (a trotro does not wait).
  const passenger: Coord = { lat: payload.pickupLat, lng: payload.pickupLng };
  const passengerDest: Coord = {
    lat: destination.latitude,
    lng: destination.longitude,
  };

  const evaluated = (
    await Promise.all(
      candidates.map(async (run) => {
        const corridor = servesCorridor(
          run,
          passenger,
          passengerDest,
          destination.zoneId,
        );
        if (!corridor.serves) return null;

        const pickup =
          corridor.pickupPoint ??
          computePickupPoint(run, payload.pickupLat, payload.pickupLng);
        const [vanEta, walkEta] = await Promise.all([
          etaToPickup(run, pickup),
          walkingEta(passenger, pickup),
        ]);
        const { readyIn, waitMin, feasible } = assessTiming(walkEta, vanEta);
        return { run, pickup, vanEta, walkEta, readyIn, waitMin, feasible };
      }),
    )
  ).filter((e): e is NonNullable<typeof e> => e !== null);

  // None of the nearby vans' routes actually serve this destination/direction.
  if (!evaluated.length) {
    return registerUnmetDemand(
      `No trotro whose route passes ${destination.town} near you right now. We'll alert nearby drivers if more people want this route.`,
    );
  }

  // Of the route-compatible vans, keep only ones the passenger can catch.
  const viable = evaluated.filter((e) => e.feasible);

  if (!viable.length) {
    return registerUnmetDemand(
      `A trotro passes ${destination.town}, but you can't reach a boarding point before it passes. We'll alert drivers if more people want this route.`,
    );
  }

  // Soonest catchable van first; prefer a shorter wait on ties.
  viable.sort((a, b) => a.vanEta - b.vanEta || a.waitMin - b.waitMin);

  // Reserve a seat on the best viable candidate that still has room (atomic).
  let chosen: (typeof viable)[number] | null = null;
  let reservedRun: any = null;
  for (const option of viable) {
    reservedRun = await DriverRun.findOneAndUpdate(
      {
        _id: option.run._id,
        status: "active",
        availableSeats: { $gte: payload.seats },
      },
      { $inc: { availableSeats: -payload.seats } },
      { returnDocument: "after" },
    );
    if (reservedRun) {
      chosen = option;
      break;
    }
  }

  if (!chosen || !reservedRun) {
    return {
      status: StatusCodes.CONFLICT,
      message: "The nearby trotros just filled up. Please try again.",
    };
  }

  // Fare for the passenger's segment (pickup -> destination).
  const pickupZone =
    nearestTown(chosen.pickup.lat, chosen.pickup.lng)?.zoneId ??
    destination.zoneId;

  let distanceKm: number;
  try {
    const r = await mapsService.getRoadDistance(chosen.pickup, {
      lat: destination.latitude,
      lng: destination.longitude,
    });
    distanceKm = r.distanceKm;
  } catch {
    distanceKm = haversineKm(
      chosen.pickup.lat,
      chosen.pickup.lng,
      destination.latitude,
      destination.longitude,
    );
  }

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
    run: reservedRun._id,
    driver: reservedRun.driver,
    vehicle: reservedRun.vehicle ?? null,
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
    status: "accepted",
  });

  return {
    status: StatusCodes.CREATED,
    message: `Matched! Walk to ${pickupName} (~${chosen.walkEta} min) — your trotro reaches it in about ${chosen.vanEta} min.`,
    data: {
      booking,
      pickupPoint: { name: pickupName, ...chosen.pickup },
      etaMinutes: chosen.vanEta, // van arrival at the boarding point
      walkMinutes: chosen.walkEta, // passenger walk time to the point
      readyInMinutes: chosen.readyIn, // walk + safety buffer
      waitMinutes: chosen.waitMin, // expected wait at the stop
      seatsRemaining: reservedRun.availableSeats,
      fare: { total, ...fare },
    },
  };
};
