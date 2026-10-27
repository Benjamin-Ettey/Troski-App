import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import User from "../models/User";
import DriverProfile from "../models/DriverProfile";
import Booking from "../models/Booking";
import DriverRun from "../models/DriverRun";
import { completeBooking } from "../services/booking/lifecycle.service";
import { broadcastRunLocation } from "../services/booking/tracking.service";
import { endRunService } from "../services/driver/run.service";
import { cancelBookingService } from "../services/booking/booking.service";
import { connectTestDb, clearDb, closeTestDb } from "./helpers/db";

const DEST = { lat: 5.66, lng: -0.1 };
const FAR = { lat: 6.69, lng: -1.62 };

beforeAll(async () => {
  await connectTestDb();
});
afterAll(async () => {
  await closeTestDb();
});
afterEach(async () => {
  await clearDb();
});

const makePassenger = async (n = 1) =>
  User.create({
    name: `Rider ${n}`, email: `rider${n}@example.com`,
    phoneNumber: `+2332400000${10 + n}`, role: "passenger",
    pinHash: "1234", phoneVerified: true,
  });

// A run with `reserved` seats already taken (availableSeats = total - reserved).
const makeRun = async (driverId: any, reserved: number, total = 4) =>
  DriverRun.create({
    driver: driverId,
    origin: { town: "A", zoneId: "ACCRA_CBD", latitude: FAR.lat, longitude: FAR.lng },
    destination: { town: "B", zoneId: "NORTH_ACC", latitude: DEST.lat, longitude: DEST.lng },
    currentLocation: { type: "Point", coordinates: [FAR.lng, FAR.lat] },
    availableSeats: total - reserved,
    totalSeats: total,
    status: "active",
    lastLocationAt: new Date(),
  });

const makeBooking = async (
  passengerId: any,
  run: any,
  status: "accepted" | "arrived" | "in_progress",
) =>
  Booking.create({
    passenger: passengerId,
    run: run._id,
    driver: run.driver,
    pickup: { town: "P", zoneId: "ACCRA_CBD", latitude: 5.56, longitude: -0.2 },
    destination: { town: "B", zoneId: "NORTH_ACC", latitude: DEST.lat, longitude: DEST.lng },
    pickupPoint: { name: "Junction", latitude: 5.56, longitude: -0.2 },
    distanceKm: 8,
    seatsRequested: 1,
    fareEstimate: 7,
    status,
  });

describe("Phase 6 — seat return on trip end", () => {
  it("returns the seat to the run when a booking completes", async () => {
    const passenger = await makePassenger();
    const run = await makeRun(new mongoose.Types.ObjectId(), 1); // 3 available
    const booking = await makeBooking(passenger._id, run, "in_progress");

    await completeBooking(String(booking._id));

    const after = await DriverRun.findById(run._id);
    expect(after?.availableSeats).toBe(4); // seat returned, capped at total
    const b = await Booking.findById(booking._id);
    expect(b?.status).toBe("completed");
  });

  it("returns the seat when a booking is cancelled", async () => {
    const passenger = await makePassenger();
    const run = await makeRun(new mongoose.Types.ObjectId(), 1);
    const booking = await makeBooking(passenger._id, run, "accepted");

    const res = await cancelBookingService(passenger._id, "passenger", String(booking._id));
    expect(res.status).toBe(StatusCodes.OK);

    const after = await DriverRun.findById(run._id);
    expect(after?.availableSeats).toBe(4);
  });
});

describe("Phase 6 — geofence auto-complete", () => {
  it("auto-ends an in-progress trip when the van reaches the destination", async () => {
    const passenger = await makePassenger();
    const run = await makeRun(new mongoose.Types.ObjectId(), 1);
    const booking = await makeBooking(passenger._id, run, "in_progress");

    // Van far from destination: no completion.
    run.currentLocation = { type: "Point", coordinates: [FAR.lng, FAR.lat] };
    await broadcastRunLocation(run);
    expect((await Booking.findById(booking._id))?.status).toBe("in_progress");

    // Van arrives at destination: auto-complete.
    run.currentLocation = { type: "Point", coordinates: [DEST.lng, DEST.lat] };
    await broadcastRunLocation(run);

    const b = await Booking.findById(booking._id);
    expect(b?.status).toBe("completed");
    const after = await DriverRun.findById(run._id);
    expect(after?.availableSeats).toBe(4);
  });
});

describe("Phase 6 — run-end resolution", () => {
  it("completes in-progress and expires never-boarded bookings when the driver ends the run", async () => {
    const driverUser = await User.create({
      name: "Kofi", email: "driver@example.com", phoneNumber: "+233240000099",
      role: "driver", pinHash: "1234", phoneVerified: true,
    });
    const profile = await DriverProfile.create({
      user: driverUser._id, verificationStatus: "approved",
    });

    const run = await makeRun(profile._id, 2); // 2 available, 2 reserved
    const p1 = await makePassenger(1);
    const p2 = await makePassenger(2);
    const riding = await makeBooking(p1._id, run, "in_progress");
    const waiting = await makeBooking(p2._id, run, "accepted");

    const res = await endRunService(driverUser._id);
    expect(res.status).toBe(StatusCodes.OK);

    expect((await Booking.findById(riding._id))?.status).toBe("completed");
    expect((await Booking.findById(waiting._id))?.status).toBe("expired");
    // Both seats returned.
    expect((await DriverRun.findById(run._id))?.availableSeats).toBe(4);
  });
});
