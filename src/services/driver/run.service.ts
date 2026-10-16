import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import DriverProfile from "../../models/DriverProfile";
import Vehicle from "../../models/Vehicle";
import DriverRun from "../../models/DriverRun";
import { ServiceResponse } from "../auth/local/auth.service";
import { resolvePlace } from "../../utils/locationLookup";
import { mapsService } from "../maps/maps.service";
import { broadcastRunLocation } from "../booking/tracking.service";
import { resolveRunBookings } from "../booking/lifecycle.service";

const clampSeats = (n: number, max: number): number =>
  Math.max(0, Math.min(max, Math.floor(n)));

// A run whose GPS hasn't updated within this window is treated as stale (the
// driver likely closed the app without ending the run). Active runs stream
// location every few seconds, so this stays fresh for genuine runs.
const STALE_RUN_MINUTES = 2;
const staleRunCutoff = (): Date =>
  new Date(Date.now() - STALE_RUN_MINUTES * 60 * 1000);

/**
 * End "ghost" runs: active runs that stopped reporting GPS. Marks the run ended
 * and the driver offline so they can't be matched to a passenger on a frozen,
 * out-of-date position. Runs lazily before each nearby search so the collection
 * self-heals without a background job (a scheduled sweep is the scale-time
 * upgrade).
 */
export const endStaleRuns = async (): Promise<void> => {
  const cutoff = staleRunCutoff();
  const stale = await DriverRun.find({
    status: "active",
    lastLocationAt: { $lt: cutoff },
  }).select("driver");

  if (!stale.length) return;

  const runIds = stale.map((r) => r._id);
  const driverIds = stale.map((r) => r.driver);

  // Resolve attached bookings. Ghost end: don't auto-pay ambiguous in-progress
  // trips — only expire + refund passengers who never actually boarded.
  for (const run of stale) {
    await resolveRunBookings(String(run._id), { completeInProgress: false });
  }

  await DriverRun.updateMany(
    { _id: { $in: runIds } },
    { $set: { status: "ended", endedAt: new Date() } },
  );
  await DriverProfile.updateMany(
    { _id: { $in: driverIds } },
    { $set: { isOnline: false } },
  );
};

/**
 * Driver starts a run: declares a From -> To route, goes online, and begins
 * sharing location. Route geometry is fetched best-effort (null without a maps
 * key). One active run per driver.
 */
export const startRunService = async (
  driverUserId: Types.ObjectId,
  payload: {
    fromLat?: number;
    fromLng?: number;
    fromTown?: string;
    toLat?: number;
    toLng?: number;
    toTown?: string;
    availableSeats?: number;
  },
): Promise<ServiceResponse> => {
  const profile = await DriverProfile.findOne({ user: driverUserId });
  if (!profile) {
    return { status: StatusCodes.NOT_FOUND, message: "Driver profile not found" };
  }

  // Route endpoints may be dropped pins (coords) or town names.
  const origin = resolvePlace({
    lat: payload.fromLat,
    lng: payload.fromLng,
    town: payload.fromTown,
  });
  const destination = resolvePlace({
    lat: payload.toLat,
    lng: payload.toLng,
    town: payload.toTown,
  });
  if (!origin) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "A start location (coordinates or town) is required",
    };
  }
  if (!destination) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "A destination (coordinates or town) is required",
    };
  }
  if (
    origin.latitude === destination.latitude &&
    origin.longitude === destination.longitude
  ) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Start and destination cannot be the same",
    };
  }

  const existing = await DriverRun.findOne({
    driver: profile._id,
    status: "active",
  });
  if (existing) {
    return {
      status: StatusCodes.CONFLICT,
      message: "You already have an active run. End it before starting another.",
      data: { runId: existing._id },
    };
  }

  const vehicle = await Vehicle.findOne({
    driver: profile._id,
    vehicleStatus: "approved",
  });
  const capacity = (vehicle?.vehicleCapacity as number) ?? 1;
  const availableSeats =
    payload.availableSeats != null
      ? clampSeats(payload.availableSeats, capacity)
      : capacity;

  // Best-effort route geometry (ignored if maps is unconfigured/unavailable).
  let routePolyline: string | null = null;
  let routeDistanceKm: number | null = null;
  try {
    const directions = await mapsService.getDirections(
      { lat: origin.latitude, lng: origin.longitude },
      { lat: destination.latitude, lng: destination.longitude },
    );
    routePolyline = directions.polyline;
    routeDistanceKm = directions.distanceKm;
  } catch {
    // No maps key / provider error — continue without geometry.
  }

  const run = await DriverRun.create({
    driver: profile._id,
    vehicle: vehicle?._id,
    origin,
    destination,
    routePolyline,
    routeDistanceKm,
    currentLocation: {
      type: "Point",
      coordinates: [origin.longitude, origin.latitude],
    },
    availableSeats,
    totalSeats: capacity,
    status: "active",
    startedAt: new Date(),
    lastLocationAt: new Date(),
  });

  profile.isOnline = true;
  profile.lastSeenAt = new Date();
  await profile.save();

  return {
    status: StatusCodes.CREATED,
    message: "Run started. You are now live.",
    data: { run },
  };
};

const getActiveRun = async (driverUserId: Types.ObjectId) => {
  const profile = await DriverProfile.findOne({ user: driverUserId });
  if (!profile) return { profile: null, run: null };
  const run = await DriverRun.findOne({
    driver: profile._id,
    status: "active",
  });
  return { profile, run };
};

/**
 * High-frequency GPS heartbeat: update live position (and optionally seats).
 */
export const updateLocationService = async (
  driverUserId: Types.ObjectId,
  payload: { latitude: number; longitude: number; availableSeats?: number },
): Promise<ServiceResponse> => {
  const { profile, run } = await getActiveRun(driverUserId);
  if (!profile) {
    return { status: StatusCodes.NOT_FOUND, message: "Driver profile not found" };
  }
  if (!run) {
    return { status: StatusCodes.NOT_FOUND, message: "No active run" };
  }

  run.currentLocation = {
    type: "Point",
    coordinates: [payload.longitude, payload.latitude],
  };
  run.lastLocationAt = new Date();
  if (payload.availableSeats != null) {
    run.availableSeats = clampSeats(payload.availableSeats, run.totalSeats);
  }
  await run.save();

  profile.lastSeenAt = new Date();
  await profile.save();

  // Push the new position to any passengers tracking this run (+ pickup alerts).
  await broadcastRunLocation(run);

  return {
    status: StatusCodes.OK,
    message: "Location updated",
    data: {
      location: run.currentLocation.coordinates,
      availableSeats: run.availableSeats,
    },
  };
};

/**
 * Update available seats as passengers board/alight. Accepts either an absolute
 * `availableSeats` or a relative `delta` (e.g. -1 when someone boards).
 */
export const updateSeatsService = async (
  driverUserId: Types.ObjectId,
  payload: { availableSeats?: number; delta?: number },
): Promise<ServiceResponse> => {
  const { profile, run } = await getActiveRun(driverUserId);
  if (!profile) {
    return { status: StatusCodes.NOT_FOUND, message: "Driver profile not found" };
  }
  if (!run) {
    return { status: StatusCodes.NOT_FOUND, message: "No active run" };
  }

  const next =
    payload.availableSeats != null
      ? payload.availableSeats
      : run.availableSeats + (payload.delta ?? 0);
  run.availableSeats = clampSeats(next, run.totalSeats);
  await run.save();

  return {
    status: StatusCodes.OK,
    message: "Seats updated",
    data: { availableSeats: run.availableSeats, totalSeats: run.totalSeats },
  };
};

/** End the active run and go offline. */
export const endRunService = async (
  driverUserId: Types.ObjectId,
): Promise<ServiceResponse> => {
  const { profile, run } = await getActiveRun(driverUserId);
  if (!profile) {
    return { status: StatusCodes.NOT_FOUND, message: "Driver profile not found" };
  }
  if (!run) {
    return { status: StatusCodes.NOT_FOUND, message: "No active run" };
  }

  run.status = "ended";
  run.endedAt = new Date();
  await run.save();

  profile.isOnline = false;
  await profile.save();

  // Driver ended normally: complete passengers mid-trip (settle fares) and
  // expire + refund any who were matched but never boarded.
  await resolveRunBookings(String(run._id), { completeInProgress: true });

  return {
    status: StatusCodes.OK,
    message: "Run ended. You are now offline.",
    data: { runId: run._id },
  };
};

export const getActiveRunService = async (
  driverUserId: Types.ObjectId,
): Promise<ServiceResponse> => {
  const { profile, run } = await getActiveRun(driverUserId);
  if (!profile) {
    return { status: StatusCodes.NOT_FOUND, message: "Driver profile not found" };
  }
  if (!run) {
    return { status: StatusCodes.NOT_FOUND, message: "No active run" };
  }
  return { status: StatusCodes.OK, message: "Active run", data: { run } };
};

/**
 * Find active runs near a point that have seats and (optionally) head to a given
 * destination zone. Sorted nearest-first by the 2dsphere index. Used by the
 * Phase 4 matcher.
 */
export const findNearbyRuns = async (opts: {
  lat: number;
  lng: number;
  destinationZone?: string;
  minSeats?: number;
  radiusKm?: number;
  limit?: number;
}) => {
  // Self-heal first so we never match a passenger to a ghost run.
  await endStaleRuns();

  const filter: Record<string, unknown> = {
    status: "active",
    availableSeats: { $gte: opts.minSeats ?? 1 },
    // Belt-and-suspenders freshness guard (in case a run goes stale between the
    // sweep above and this query).
    lastLocationAt: { $gte: staleRunCutoff() },
    currentLocation: {
      $near: {
        $geometry: { type: "Point", coordinates: [opts.lng, opts.lat] },
        $maxDistance: (opts.radiusKm ?? 5) * 1000,
      },
    },
  };
  if (opts.destinationZone) {
    filter["destination.zoneId"] = opts.destinationZone;
  }

  return DriverRun.find(filter).limit(opts.limit ?? 20);
};
