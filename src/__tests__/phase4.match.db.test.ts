import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import User from "../models/User";
import Booking from "../models/Booking";
import DriverRun from "../models/DriverRun";
import { matchRideService } from "../services/booking/match.service";
import { resolveTown } from "../utils/locationLookup";
import { encodePolyline, type Point } from "../utils/polyline";
import { connectTestDb, clearDb, closeTestDb } from "./helpers/db";

// Passenger in Accra; destination is "Mim" (resolved to its real zone/coords).
const PICKUP = { lat: 5.56, lng: -0.2 };
// Van ~2 km north — a few minutes out, so the passenger can reach the stop in
// time (the feasibility check rejects a van that's already on top of them).
const VAN = { lat: 5.578, lng: -0.2 };
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
      coordinates: [opts.lng ?? VAN.lng, opts.lat ?? VAN.lat],
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

  it("won't match a van that would pass before the passenger can reach the stop", async () => {
    // Van sitting on top of the passenger — arrives in ~1 min, not catchable.
    await seedRun({ seats: 3, lat: PICKUP.lat, lng: PICKUP.lng });
    const res = await matchRideService(passengerId, {
      pickupLat: PICKUP.lat,
      pickupLng: PICKUP.lng,
      destinationTown: "Mim",
      seats: 1,
    });
    expect(res.status).toBe(StatusCodes.NOT_FOUND);
    expect(res.data.demandId).toBeDefined();
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

describe("Booking Phase 4 — route-corridor matching (with a polyline)", () => {
  // A straight west->east route; van at the western start.
  const ROUTE: Point[] = Array.from({ length: 11 }, (_, i) => ({
    lat: 5.5,
    lng: -0.2 + i * 0.01, // -0.20 .. -0.10
  }));
  const CORRIDOR_VAN = { lat: 5.5, lng: -0.2 }; // route[0]
  const PICKUP_ON_ROUTE = { lat: 5.5, lng: -0.18 }; // route[2]
  const DEST_AHEAD = { lat: 5.5, lng: -0.12 }; // route[8]
  const DEST_BEHIND = { lat: 5.5, lng: -0.19 }; // route[1], before pickup

  const seedRouteRun = async () =>
    DriverRun.create({
      driver: new mongoose.Types.ObjectId(),
      vehicle: new mongoose.Types.ObjectId(),
      origin: { town: "Start", zoneId: "ACCRA_CBD", latitude: CORRIDOR_VAN.lat, longitude: CORRIDOR_VAN.lng },
      destination: { town: "End", zoneId: "ACCRA_CBD", latitude: 5.5, longitude: -0.1 },
      routePolyline: encodePolyline(ROUTE),
      currentLocation: { type: "Point", coordinates: [CORRIDOR_VAN.lng, CORRIDOR_VAN.lat] },
      availableSeats: 3,
      totalSeats: 4,
      status: "active",
      lastLocationAt: new Date(),
    });

  it("matches when the destination is ahead on the van's route", async () => {
    await seedRouteRun();
    const res = await matchRideService(passengerId, {
      pickupLat: PICKUP_ON_ROUTE.lat,
      pickupLng: PICKUP_ON_ROUTE.lng,
      destLat: DEST_AHEAD.lat,
      destLng: DEST_AHEAD.lng,
      seats: 1,
    });
    expect(res.status).toBe(StatusCodes.CREATED);
  });

  it("does NOT match when the destination is behind the pickup", async () => {
    await seedRouteRun();
    const res = await matchRideService(passengerId, {
      pickupLat: PICKUP_ON_ROUTE.lat,
      pickupLng: PICKUP_ON_ROUTE.lng,
      destLat: DEST_BEHIND.lat,
      destLng: DEST_BEHIND.lng,
      seats: 1,
    });
    expect(res.status).toBe(StatusCodes.NOT_FOUND); // wrong direction -> demand
  });
});
