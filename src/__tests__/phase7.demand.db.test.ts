import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import User from "../models/User";
import DriverProfile from "../models/DriverProfile";
import DriverRun from "../models/DriverRun";
import DemandRequest from "../models/DemandRequest";
import DemandCluster from "../models/DemandCluster";
import {
  recordDemand,
  runClustering,
  listDemandForDriverService,
  acceptDemandService,
} from "../services/booking/demand.service";
import type { LocationPoint } from "../types/booking.types";
import { connectTestDb, clearDb, closeTestDb } from "./helpers/db";

const ORIGIN = { lat: 5.6, lng: -0.2 };
const DEST: LocationPoint = {
  town: "Madina", zoneId: "NORTH_ACC", latitude: 5.68, longitude: -0.16,
};

beforeAll(async () => {
  await connectTestDb();
  await DriverRun.createIndexes();
  await DemandCluster.createIndexes();
});
afterAll(async () => {
  await closeTestDb();
});
afterEach(async () => {
  await clearDb();
});

// Record `n` unmet requests from the same area to the same destination.
const seedDemand = async (n: number) => {
  for (let i = 0; i < n; i++) {
    const passenger = await User.create({
      name: `Rider ${i}`, email: `rider${i}@example.com`,
      phoneNumber: `+2332400000${20 + i}`, role: "passenger",
      pinHash: "1234", phoneVerified: true,
    });
    await recordDemand(
      passenger._id,
      { lat: ORIGIN.lat + i * 0.0003, lng: ORIGIN.lng + i * 0.0003 },
      DEST,
      1,
    );
  }
};

describe("Phase 7 — demand recording + clustering (DB)", () => {
  it("records a demand request with its H3 cell", async () => {
    await seedDemand(1);
    const req = await DemandRequest.findOne({});
    expect(req?.status).toBe("pending");
    expect(typeof req?.originH3).toBe("string");
  });

  it("forms a cluster once 5 passengers want the same route", async () => {
    await seedDemand(4);
    expect((await runClustering()).clustersFormed).toBe(0);

    await seedDemand(1); // now 5 total
    const result = await runClustering();
    expect(result.clustersFormed).toBe(1);

    const cluster = await DemandCluster.findOne({});
    expect(cluster?.passengerCount).toBe(5);
    expect(cluster?.status).toBe("open");
    expect(await DemandRequest.countDocuments({ status: "clustered" })).toBe(5);
  });
});

describe("Phase 7 — driver sees + accepts demand", () => {
  let driverSeq = 0;
  const makeDriverWithRun = async () => {
    const n = ++driverSeq;
    const driverUser = await User.create({
      name: `Kofi ${n}`, email: `driver${n}@example.com`,
      phoneNumber: `+23324000${900 + n}`,
      role: "driver", pinHash: "1234", phoneVerified: true,
    });
    const profile = await DriverProfile.create({
      user: driverUser._id, verificationStatus: "approved",
    });
    const run = await DriverRun.create({
      driver: profile._id,
      origin: { town: "A", zoneId: "ACCRA_CBD", latitude: ORIGIN.lat, longitude: ORIGIN.lng },
      destination: { town: "Somewhere", zoneId: "ACCRA_CBD", latitude: 5.55, longitude: -0.22 },
      currentLocation: { type: "Point", coordinates: [ORIGIN.lng, ORIGIN.lat] },
      availableSeats: 10,
      totalSeats: 14,
      status: "active",
      lastLocationAt: new Date(),
    });
    return { driverUserId: driverUser._id, run };
  };

  it("lists open clusters near the driver and redirects the run on accept", async () => {
    await seedDemand(5);
    await runClustering();
    const { driverUserId, run } = await makeDriverWithRun();

    const list = await listDemandForDriverService(driverUserId);
    expect(list.status).toBe(StatusCodes.OK);
    expect(list.data.count).toBe(1);

    const clusterId = String(list.data.clusters[0]._id);
    const accept = await acceptDemandService(driverUserId, clusterId);
    expect(accept.status).toBe(StatusCodes.OK);

    // Run redirected to the demand destination.
    const updatedRun = await DriverRun.findById(run._id);
    expect(updatedRun?.destination?.zoneId).toBe("NORTH_ACC");

    // Cluster accepted, requests served.
    const cluster = await DemandCluster.findById(clusterId);
    expect(cluster?.status).toBe("accepted");
    expect(await DemandRequest.countDocuments({ status: "served" })).toBe(5);
  });

  it("rejects a second driver accepting the same cluster", async () => {
    await seedDemand(5);
    await runClustering();
    const cluster = await DemandCluster.findOne({});

    const d1 = await makeDriverWithRun();
    const d2 = await makeDriverWithRun();

    const first = await acceptDemandService(d1.driverUserId, String(cluster!._id));
    expect(first.status).toBe(StatusCodes.OK);
    const second = await acceptDemandService(d2.driverUserId, String(cluster!._id));
    expect(second.status).toBe(StatusCodes.CONFLICT);
  });
});
