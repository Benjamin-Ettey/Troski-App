import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import User from "../models/User";
import DriverProfile from "../models/DriverProfile";
import Vehicle from "../models/Vehicle";
import DriverRun from "../models/DriverRun";
import {
  startRunService,
  updateLocationService,
  updateSeatsService,
  endRunService,
  getActiveRunService,
  findNearbyRuns,
} from "../services/driver/run.service";
import { connectTestDb, clearDb, closeTestDb } from "./helpers/db";

let driverUserId: any;
let seq = 0;

beforeAll(async () => {
  await connectTestDb();
  // Ensure 2dsphere + partial-unique indexes exist before geo queries.
  await DriverRun.createIndexes();
});
afterAll(async () => {
  await closeTestDb();
});
afterEach(async () => {
  await clearDb();
});

// Create an approved driver with an approved vehicle; return the user id.
const makeApprovedDriver = async (capacity = 4) => {
  const n = ++seq;
  const user = await User.create({
    name: `Driver ${n}`, email: `driver${n}@example.com`,
    phoneNumber: `+23324000${1000 + n}`, role: "driver",
    pinHash: "1234", phoneVerified: true,
  });
  const profile = await DriverProfile.create({
    user: user._id, verificationStatus: "approved", momoNumber: "0241234567",
  });
  await Vehicle.create({
    driver: profile._id, vehicleMake: "Toyota Hiace",
    plateNumber: `GT${2000 + n}23`, vehicleColor: "Yellow",
    vehicleCapacity: capacity, vehicleImage: "i", insuranceCertImage: "i",
    vehicleRegDocImage: "i", DVLARoadworthyImage: "i", vehicleStatus: "approved",
  });
  return { userId: user._id, profileId: profile._id };
};

// Create an active run doc directly at a given position (for geo tests).
const seedRun = async (
  lng: number,
  lat: number,
  opts: { seats?: number; destZone?: string; town?: string } = {},
) =>
  DriverRun.create({
    driver: new mongoose.Types.ObjectId(),
    origin: { town: opts.town ?? "Origin", zoneId: "ACCRA_CBD", latitude: lat, longitude: lng },
    destination: {
      town: "Dest", zoneId: opts.destZone ?? "NORTH_ACC", latitude: lat + 0.1, longitude: lng + 0.1,
    },
    currentLocation: { type: "Point", coordinates: [lng, lat] },
    availableSeats: opts.seats ?? 3,
    totalSeats: 4,
    status: "active",
    lastLocationAt: new Date(),
  });

describe("Booking Phase 3 — run lifecycle", () => {
  beforeEach(async () => {
    const d = await makeApprovedDriver(4);
    driverUserId = d.userId;
  });

  it("starts a run, goes online, defaults seats to capacity", async () => {
    const res = await startRunService(driverUserId, {
      fromTown: "Goaso",
      toTown: "Mim",
    });
    expect(res.status).toBe(StatusCodes.CREATED);
    expect(res.data.run.availableSeats).toBe(4);
    expect(res.data.run.totalSeats).toBe(4);
    expect(res.data.run.status).toBe("active");

    const profile = await DriverProfile.findOne({ user: driverUserId });
    expect(profile?.isOnline).toBe(true);
  });

  it("rejects a second active run", async () => {
    await startRunService(driverUserId, { fromTown: "Goaso", toTown: "Mim" });
    const res = await startRunService(driverUserId, {
      fromTown: "Goaso",
      toTown: "Mim",
    });
    expect(res.status).toBe(StatusCodes.CONFLICT);
  });

  it("updates seats by delta and clamps to [0, capacity]", async () => {
    await startRunService(driverUserId, { fromTown: "Goaso", toTown: "Mim" });

    let res = await updateSeatsService(driverUserId, { delta: -1 });
    expect(res.data.availableSeats).toBe(3);

    res = await updateSeatsService(driverUserId, { delta: -10 });
    expect(res.data.availableSeats).toBe(0); // clamped

    res = await updateSeatsService(driverUserId, { availableSeats: 99 });
    expect(res.data.availableSeats).toBe(4); // clamped to capacity
  });

  it("updates live location", async () => {
    await startRunService(driverUserId, { fromTown: "Goaso", toTown: "Mim" });
    const res = await updateLocationService(driverUserId, {
      latitude: 5.56,
      longitude: -0.2,
    });
    expect(res.status).toBe(StatusCodes.OK);
    expect(res.data.location).toEqual([-0.2, 5.56]);
  });

  it("ends a run and goes offline", async () => {
    await startRunService(driverUserId, { fromTown: "Goaso", toTown: "Mim" });
    const ended = await endRunService(driverUserId);
    expect(ended.status).toBe(StatusCodes.OK);

    const profile = await DriverProfile.findOne({ user: driverUserId });
    expect(profile?.isOnline).toBe(false);

    const active = await getActiveRunService(driverUserId);
    expect(active.status).toBe(StatusCodes.NOT_FOUND);
  });
});

describe("Booking Phase 3 — nearby search (2dsphere)", () => {
  it("returns only nearby, seated runs heading to the destination zone", async () => {
    // Near Accra, right zone, has seats — should match.
    await seedRun(-0.2, 5.56, { seats: 3, destZone: "NORTH_ACC", town: "MATCH" });
    // Near Accra but full — excluded by minSeats.
    await seedRun(-0.201, 5.561, { seats: 0, destZone: "NORTH_ACC", town: "FULL" });
    // Near Accra but wrong destination zone — excluded.
    await seedRun(-0.202, 5.562, { seats: 3, destZone: "EAST_ACC", town: "WRONGDEST" });
    // Far away (Kumasi) — excluded by radius.
    await seedRun(-1.62, 6.69, { seats: 3, destZone: "NORTH_ACC", town: "FAR" });

    const runs = await findNearbyRuns({
      lat: 5.56,
      lng: -0.2,
      destinationZone: "NORTH_ACC",
      minSeats: 1,
      radiusKm: 5,
    });

    const towns = runs.map((r) => r.origin?.town);
    expect(towns).toContain("MATCH");
    expect(towns).not.toContain("FULL");
    expect(towns).not.toContain("WRONGDEST");
    expect(towns).not.toContain("FAR");
  });

  it("excludes and auto-ends stale (ghost) runs", async () => {
    // A run whose GPS stopped 5 minutes ago.
    const ghost = await DriverRun.create({
      driver: new mongoose.Types.ObjectId(),
      origin: { town: "GHOST", zoneId: "ACCRA_CBD", latitude: 5.56, longitude: -0.2 },
      destination: { town: "Dest", zoneId: "NORTH_ACC", latitude: 5.66, longitude: -0.1 },
      currentLocation: { type: "Point", coordinates: [-0.2, 5.56] },
      availableSeats: 3,
      totalSeats: 4,
      status: "active",
      lastLocationAt: new Date(Date.now() - 5 * 60 * 1000),
    });

    const runs = await findNearbyRuns({
      lat: 5.56,
      lng: -0.2,
      destinationZone: "NORTH_ACC",
      minSeats: 1,
      radiusKm: 5,
    });

    expect(runs.map((r) => r.origin?.town)).not.toContain("GHOST");
    // ...and the ghost run was auto-ended.
    const after = await DriverRun.findById(ghost._id);
    expect(after?.status).toBe("ended");
  });
});
