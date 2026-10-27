import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import DemandRequest from "../../models/DemandRequest";
import DemandCluster from "../../models/DemandCluster";
import DriverProfile from "../../models/DriverProfile";
import DriverRun from "../../models/DriverRun";
import { ServiceResponse } from "../auth/local/auth.service";
import { mapsService } from "../maps/maps.service";
import { publish, demandChannel } from "../realtime/sse";
import { toCell, formClusters, type DemandItem } from "./demand.core";
import type { LocationPoint } from "../../types/booking.types";

// Only recent demand is clustered; older unmet requests are considered stale.
const DEMAND_WINDOW_MIN = 30;
// How far a driver will see demand clusters from their current position.
const DRIVER_DEMAND_RADIUS_KM = 8;

const demandWindowCutoff = (): Date =>
  new Date(Date.now() - DEMAND_WINDOW_MIN * 60 * 1000);

/**
 * Record an unmet ride request (no van was heading that way). Tagged with its
 * H3 cell so it can be clustered. Called by the matcher on a no-candidate result.
 */
export const recordDemand = async (
  passengerId: Types.ObjectId,
  pickup: { lat: number; lng: number; zoneId?: string },
  destination: LocationPoint,
  seats: number,
): Promise<any> => {
  return DemandRequest.create({
    passenger: passengerId,
    pickup: {
      zoneId: pickup.zoneId,
      latitude: pickup.lat,
      longitude: pickup.lng,
    },
    destination: {
      town: destination.town,
      zoneId: destination.zoneId,
      latitude: destination.latitude,
      longitude: destination.longitude,
    },
    originH3: toCell(pickup.lat, pickup.lng),
    seats,
    status: "pending",
  });
};

/**
 * Cluster recent pending demand into new-route offers. Forms a DemandCluster for
 * every group of >= MIN_CLUSTER passengers sharing a destination + area.
 */
export const runClustering = async (): Promise<{
  clustersFormed: number;
}> => {
  const pending = await DemandRequest.find({
    status: "pending",
    createdAt: { $gte: demandWindowCutoff() },
  });
  if (!pending.length) return { clustersFormed: 0 };

  const byId = new Map<string, any>();
  const items: DemandItem[] = pending.map((r) => {
    byId.set(String(r._id), r);
    return {
      id: String(r._id),
      h3: r.originH3 as string,
      destZone: r.destination?.zoneId as string,
      lat: r.pickup?.latitude as number,
      lng: r.pickup?.longitude as number,
      seats: (r.seats as number) ?? 1,
    };
  });

  const clusters = formClusters(items);
  let clustersFormed = 0;

  for (const cluster of clusters) {
    // Representative destination (all members share the zone).
    const rep = byId.get(cluster.requestIds[0]);
    const [doc] = await DemandCluster.create([
      {
        destination: {
          town: rep.destination?.town,
          zoneId: cluster.destZone,
          latitude: rep.destination?.latitude,
          longitude: rep.destination?.longitude,
        },
        centroid: {
          type: "Point",
          coordinates: [cluster.centroid.lng, cluster.centroid.lat],
        },
        requests: cluster.requestIds,
        passengerCount: cluster.passengerCount,
        totalSeats: cluster.totalSeats,
        status: "open",
      },
    ]);
    await DemandRequest.updateMany(
      { _id: { $in: cluster.requestIds } },
      { $set: { status: "clustered", cluster: doc._id } },
    );
    clustersFormed++;
  }

  return { clustersFormed };
};

/** A passenger checks the status of their demand request. */
export const getDemandStatusService = async (
  passengerId: Types.ObjectId,
  demandId: string,
): Promise<ServiceResponse> => {
  const demand = await DemandRequest.findById(demandId).populate(
    "cluster",
    "status passengerCount destination run",
  );
  if (!demand) {
    return { status: StatusCodes.NOT_FOUND, message: "Demand request not found" };
  }
  if (String(demand.passenger) !== String(passengerId)) {
    return { status: StatusCodes.FORBIDDEN, message: "Not your request" };
  }
  return {
    status: StatusCodes.OK,
    message: "Demand status",
    data: { demand },
  };
};

/** Open demand clusters near the driver's current position. */
export const listDemandForDriverService = async (
  driverUserId: Types.ObjectId,
): Promise<ServiceResponse> => {
  const profile = await DriverProfile.findOne({ user: driverUserId });
  if (!profile) {
    return { status: StatusCodes.NOT_FOUND, message: "Driver profile not found" };
  }
  const run = await DriverRun.findOne({ driver: profile._id, status: "active" });
  if (!run) {
    return {
      status: StatusCodes.FORBIDDEN,
      message: "Start a run to see demand near you",
    };
  }

  const [lng, lat] = run.currentLocation!.coordinates as number[];
  const clusters = await DemandCluster.find({
    status: "open",
    centroid: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: DRIVER_DEMAND_RADIUS_KM * 1000,
      },
    },
  }).limit(20);

  return {
    status: StatusCodes.OK,
    message: "Demand clusters near you",
    data: { count: clusters.length, clusters },
  };
};

/**
 * Driver accepts a demand cluster: their active run is redirected to the
 * cluster's destination, the cluster is claimed, and the waiting passengers are
 * told a van is now coming (they can re-match to it).
 */
export const acceptDemandService = async (
  driverUserId: Types.ObjectId,
  clusterId: string,
): Promise<ServiceResponse> => {
  const profile = await DriverProfile.findOne({ user: driverUserId });
  if (!profile) {
    return { status: StatusCodes.NOT_FOUND, message: "Driver profile not found" };
  }
  const run = await DriverRun.findOne({ driver: profile._id, status: "active" });
  if (!run) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "You need an active run to accept demand",
    };
  }

  // Atomic claim so only one driver takes a cluster.
  const cluster = await DemandCluster.findOneAndUpdate(
    { _id: clusterId, status: "open" },
    {
      $set: {
        status: "accepted",
        driver: profile._id,
        run: run._id,
        acceptedAt: new Date(),
      },
    },
    { new: true },
  );
  if (!cluster) {
    return {
      status: StatusCodes.CONFLICT,
      message: "This demand is no longer available",
    };
  }

  // Redirect the run to the cluster's destination.
  run.destination = {
    town: cluster.destination?.town ?? "Destination",
    zoneId: cluster.destination?.zoneId as string,
    latitude: cluster.destination?.latitude as number,
    longitude: cluster.destination?.longitude as number,
  };
  const [vanLng, vanLat] = run.currentLocation!.coordinates as number[];
  try {
    const dir = await mapsService.getDirections(
      { lat: vanLat, lng: vanLng },
      {
        lat: cluster.destination?.latitude as number,
        lng: cluster.destination?.longitude as number,
      },
    );
    run.routePolyline = dir.polyline;
    run.routeDistanceKm = dir.distanceKm;
  } catch {
    // No maps key — leave previous geometry.
  }
  await run.save();

  // Notify each waiting passenger a van is now coming; they re-match to it.
  const requests = await DemandRequest.find({ cluster: cluster._id });
  for (const req of requests) {
    req.status = "served";
    await req.save();
    publish(demandChannel(String(req._id)), "demand_matched", {
      runId: run._id,
      destination: cluster.destination,
    });
  }

  return {
    status: StatusCodes.OK,
    message: `Accepted ${cluster.passengerCount} passengers heading to ${cluster.destination?.town ?? "the destination"}. Your route is updated.`,
    data: { cluster, run },
  };
};
