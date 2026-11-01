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
import {
  isRedisEnabled,
  geoUpsert,
  geoRemove,
  geoNearby,
} from "../realtime/redis";

const clampSeats = (n: number, max: number): number =>
  Math.max(0, Math.min(max, Math.floor(n)));

const STALE_RUN_MINUTES = 2;
const staleRunCutoff = (): Date =>
  new Date(Date.now() - STALE_RUN_MINUTES * 60 * 1000);

export const endStaleRuns = async (): Promise<void> => {
  const cutoff = staleRunCutoff();
  const stale = await DriverRun.find({
    status: "active",
    lastLocationAt: { $lt: cutoff },
  }).select("driver");

  if (!stale.length) return;

  const runIds = stale.map((r) => r._id);
  const driverIds = stale.map((r) => r.driver);

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
  await Promise.all(runIds.map((id) => geoRemove(String(id)).catch(() => {})));
};

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
  if (!profile)
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };

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
  if (!origin)
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "A start location (coordinates or town) is required",
    };
  if (!destination)
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "A destination (coordinates or town) is required",
    };
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
  if (existing)
    return {
      status: StatusCodes.CONFLICT,
      message:
        "You already have an active run. End it before starting another.",
      data: { runId: existing._id },
    };

  const vehicle = await Vehicle.findOne({
    driver: profile._id,
    vehicleStatus: "approved",
  });
  const capacity = (vehicle?.vehicleCapacity as number) ?? 1;
  const availableSeats =
    payload.availableSeats != null
      ? clampSeats(payload.availableSeats, capacity)
      : capacity;

  let routePolyline: string | null = null;
  let routeDistanceKm: number | null = null;
  try {
    const directions = await mapsService.getDirections(
      { lat: origin.latitude, lng: origin.longitude },
      { lat: destination.latitude, lng: destination.longitude },
    );
    routePolyline = directions.polyline;
    routeDistanceKm = directions.distanceKm;
  } catch {}

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

  void geoUpsert(String(run._id), origin.longitude, origin.latitude).catch(
    () => {},
  );

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

export const updateLocationService = async (
  driverUserId: Types.ObjectId,
  payload: { latitude: number; longitude: number },
): Promise<ServiceResponse> => {
  const { profile, run } = await getActiveRun(driverUserId);
  if (!profile)
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };
  if (!run) return { status: StatusCodes.NOT_FOUND, message: "No active run" };

  run.currentLocation = {
    type: "Point",
    coordinates: [payload.longitude, payload.latitude],
  };
  run.lastLocationAt = new Date();
  await run.save();

  profile.lastSeenAt = new Date();
  await profile.save();

  void geoUpsert(String(run._id), payload.longitude, payload.latitude).catch(
    () => {},
  );
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

export const updateSeatsService = async (
  driverUserId: Types.ObjectId,
  payload: { availableSeats?: number; delta?: number },
): Promise<ServiceResponse> => {
  const { profile, run } = await getActiveRun(driverUserId);
  if (!profile)
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };
  if (!run) return { status: StatusCodes.NOT_FOUND, message: "No active run" };

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

export const endRunService = async (
  driverUserId: Types.ObjectId,
): Promise<ServiceResponse> => {
  const { profile, run } = await getActiveRun(driverUserId);
  if (!profile)
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };
  if (!run) return { status: StatusCodes.NOT_FOUND, message: "No active run" };

  run.status = "ended";
  run.endedAt = new Date();
  await run.save();

  profile.isOnline = false;
  await profile.save();

  void geoRemove(String(run._id)).catch(() => {});
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
  if (!profile)
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };
  if (!run) return { status: StatusCodes.NOT_FOUND, message: "No active run" };
  return { status: StatusCodes.OK, message: "Active run", data: { run } };
};

export const findNearbyRuns = async (opts: {
  lat: number;
  lng: number;
  destinationZone?: string;
  minSeats?: number;
  radiusKm?: number;
  limit?: number;
}) => {
  await endStaleRuns();

  const radiusKm = opts.radiusKm ?? 5;
  const limit = opts.limit ?? 20;

  const baseFilter: Record<string, unknown> = {
    status: "active",
    availableSeats: { $gte: opts.minSeats ?? 1 },
    lastLocationAt: { $gte: staleRunCutoff() },
  };
  if (opts.destinationZone)
    baseFilter["destination.zoneId"] = opts.destinationZone;

  if (isRedisEnabled()) {
    const ids = await geoNearby(opts.lng, opts.lat, radiusKm);
    if (ids) {
      if (!ids.length) return [];
      return DriverRun.find({ _id: { $in: ids }, ...baseFilter }).limit(limit);
    }
  }

  return DriverRun.find({
    ...baseFilter,
    currentLocation: {
      $near: {
        $geometry: { type: "Point", coordinates: [opts.lng, opts.lat] },
        $maxDistance: radiusKm * 1000,
      },
    },
  }).limit(limit);
};
