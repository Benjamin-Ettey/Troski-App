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
import { decodePolyline, nearestPointOnPath } from "../../utils/polyline";
import { mapsService } from "../maps/maps.service";
import { calculateRouteFare } from "../fare/fare.service";
import zonesConfig from "../../data/zonesConfig";

const SEARCH_RADIUS_KM = 5;
const URBAN_SPEED_KMH = 25; // fallback ETA speed when maps is unavailable
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

  const candidates = await findNearbyRuns({
    lat: payload.pickupLat,
    lng: payload.pickupLng,
    destinationZone: destination.zoneId,
    minSeats: payload.seats,
    radiusKm: SEARCH_RADIUS_KM,
  });

  if (!candidates.length) {
    return {
      status: StatusCodes.NOT_FOUND,
      message: `No trotro heading to ${destination.town} near you right now. Try again shortly.`,
    };
  }

  // Place a pickup point on each candidate's route and rank by ETA.
  const evaluated = await Promise.all(
    candidates.map(async (run) => {
      const pickup = computePickupPoint(
        run,
        payload.pickupLat,
        payload.pickupLng,
      );
      const eta = await etaToPickup(run, pickup);
      return { run, pickup, eta };
    }),
  );
  evaluated.sort((a, b) => a.eta - b.eta);

  // Reserve a seat on the best candidate that still has room (atomic).
  let chosen: (typeof evaluated)[number] | null = null;
  let reservedRun: any = null;
  for (const option of evaluated) {
    reservedRun = await DriverRun.findOneAndUpdate(
      {
        _id: option.run._id,
        status: "active",
        availableSeats: { $gte: payload.seats },
      },
      { $inc: { availableSeats: -payload.seats } },
      { new: true },
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
    etaMinutes: chosen.eta,
    status: "accepted",
  });

  return {
    status: StatusCodes.CREATED,
    message: `Matched! Walk to ${pickupName} — your trotro arrives in about ${chosen.eta} min.`,
    data: {
      booking,
      pickupPoint: { name: pickupName, ...chosen.pickup },
      etaMinutes: chosen.eta,
      seatsRemaining: reservedRun.availableSeats,
      fare: { total, ...fare },
    },
  };
};
