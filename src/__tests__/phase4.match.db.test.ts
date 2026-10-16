import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import User from "../models/User";
import Booking from "../models/Booking";
import DriverRun from "../models/DriverRun";
import { matchRideService } from "../services/booking/match.service";
import { resolveTown } from "../utils/locationLookup";
import { connectTestDb, clearDb, closeTestDb } from "./helpers/db";

// Passenger in Accra; destination is "Mim" (resolved to its real zone/coords).
const PICKUP = { lat: 5.56, lng: -0.2 };
const DEST = resolveTown("Mim")!;

let passengerId: any;

beforeAll(async () => {
  await connectTestDb();
  await DriverRun.createIndexes();
});
afterAll(async () => {
  await closeTestDb();
});
afterEach(async () => {
  await clearDb();
});

beforeEach(async () => {
  const passenger = await User.create({
    name: "Ama Rider", email: "rider@example.com", phoneNumber: "+233240000001",
    role: "passenger", pinHash: "1234", phoneVerified: true,
  });
  passengerId = passenger._id;
});

// Seed an active run near the passenger, heading to the destination zone.
const seedRun = async (opts: { seats?: number; lng?: number; lat?: number } = {}) =>
  DriverRun.create({
    driver: new mongoose.Types.ObjectId(),
    vehicle: new mongoose.Types.ObjectId(),
    origin: { town: "Accra", zoneId: "ACCRA_CBD", latitude: PICKUP.lat, longitude: PICKUP.lng },
    destination: {
      town: DEST.town, zoneId: DEST.zoneId, latitude: DEST.latitude, longitude: DEST.longitude,
    },
    currentLocation: {
      type: "Point",
      coordinates: [opts.lng ?? PICKUP.lng, opts.lat ?? PICKUP.lat],
    },
    availableSeats: opts.seats ?? 3,
    totalSeats: 4,
    status: "active",
    lastLocationAt: new Date(),
  });

describe("Booking Phase 4 — match a ride", () => {
  it("matches to a nearby run, reserves a seat, and creates a booking", async () => {
    const run = await seedRun({ seats: 3 });

    const res = await matchRideService(passengerId, {
      pickupLat: PICKUP.lat,
      pickupLng: PICKUP.lng,
      destinationTown: "Mim",
      seats: 1,
    });

    expect(res.status).toBe(StatusCodes.CREATED);
    expect(res.data.booking.run).toEqual(run._id);
    expect(res.data.booking.status).toBe("accepted");
    expect(res.data.booking.fareEstimate).toBeGreaterThan(0);
    expect(res.data.etaMinutes).toBeGreaterThanOrEqual(1);
    expect(res.data.pickupPoint).toHaveProperty("name");

    // Seat reserved on the run.
    const updated = await DriverRun.findById(run._id);
    expect(updated?.availableSeats).toBe(2);
  });

  it("matches using a dropped-pin destination (coordinates, no town name)", async () => {
    const run = await seedRun({ seats: 3 });
    const res = await matchRideService(passengerId, {
      pickupLat: PICKUP.lat,
      pickupLng: PICKUP.lng,
      destLat: DEST.latitude,
      destLng: DEST.longitude,
      seats: 1,
    });
    expect(res.status).toBe(StatusCodes.CREATED);
    expect(res.data.booking.run).toEqual(run._id);
  });

  it("returns 404 when no trotro is heading that way nearby", async () => {
    const res = await matchRideService(passengerId, {
      pickupLat: PICKUP.lat,
      pickupLng: PICKUP.lng,
      destinationTown: "Mim",
      seats: 1,
    });
    expect(res.status).toBe(StatusCodes.NOT_FOUND);
  });

  it("won't match a run without enough seats", async () => {
    await seedRun({ seats: 1 });
    const res = await matchRideService(passengerId, {
      pickupLat: PICKUP.lat,
      pickupLng: PICKUP.lng,
      destinationTown: "Mim",
      seats: 2,
    });
    expect(res.status).toBe(StatusCodes.NOT_FOUND);
  });

  it("blocks a passenger who already has an active ride", async () => {
    await seedRun({ seats: 3 });
    await matchRideService(passengerId, {
      pickupLat: PICKUP.lat, pickupLng: PICKUP.lng, destinationTown: "Mim", seats: 1,
    });

    await seedRun({ seats: 3 });
    const res = await matchRideService(passengerId, {
      pickupLat: PICKUP.lat, pickupLng: PICKUP.lng, destinationTown: "Mim", seats: 1,
    });
    expect(res.status).toBe(StatusCodes.CONFLICT);
  });
});
