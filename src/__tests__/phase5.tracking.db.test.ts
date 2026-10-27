import mongoose from "mongoose";
import User from "../models/User";
import Booking from "../models/Booking";
import DriverRun from "../models/DriverRun";
import { broadcastRunLocation, bookingChannel } from "../services/booking/tracking.service";
import { subscribe } from "../services/realtime/sse";
import { connectTestDb, clearDb, closeTestDb } from "./helpers/db";

// Pickup point and two van positions: one far, one right on top of it.
const PICKUP = { lat: 5.56, lng: -0.2 };
const FAR = { lat: 6.69, lng: -1.62 }; // Kumasi-ish, ~250km away

const makeRes = () => {
  const writes: string[] = [];
  const res: any = {
    writes,
    setHeader() {},
    flushHeaders() {},
    write(c: string) {
      writes.push(c);
      return true;
    },
    on() {},
  };
  return res;
};

let bookingId: any;
let run: any;

beforeAll(async () => {
  await connectTestDb();
});
afterAll(async () => {
  await closeTestDb();
});
afterEach(async () => {
  await clearDb();
});

beforeEach(async () => {
  const passenger = await User.create({
    name: "Ama", email: "rider@example.com", phoneNumber: "+233240000001",
    role: "passenger", pinHash: "1234", phoneVerified: true,
  });

  run = await DriverRun.create({
    driver: new mongoose.Types.ObjectId(),
    origin: { town: "A", zoneId: "ACCRA_CBD", latitude: FAR.lat, longitude: FAR.lng },
    destination: { town: "B", zoneId: "NORTH_ACC", latitude: PICKUP.lat, longitude: PICKUP.lng },
    currentLocation: { type: "Point", coordinates: [FAR.lng, FAR.lat] },
    availableSeats: 3,
    totalSeats: 4,
    status: "active",
    lastLocationAt: new Date(),
  });

  const booking = await Booking.create({
    passenger: passenger._id,
    run: run._id,
    driver: run.driver,
    pickup: { town: "Pickup", zoneId: "ACCRA_CBD", latitude: PICKUP.lat, longitude: PICKUP.lng },
    destination: { town: "B", zoneId: "NORTH_ACC", latitude: 5.66, longitude: -0.1 },
    pickupPoint: { name: "Awudome Junction", latitude: PICKUP.lat, longitude: PICKUP.lng },
    distanceKm: 8,
    seatsRequested: 1,
    fareEstimate: 7,
    status: "accepted",
  });
  bookingId = booking._id;
});

const setVan = (lat: number, lng: number) => {
  run.currentLocation = { type: "Point", coordinates: [lng, lat] };
};

describe("Booking Phase 5 — live tracking broadcast", () => {
  it("streams van position and fires a one-time pickup alert when close", async () => {
    const res = makeRes();
    subscribe(bookingChannel(String(bookingId)), res);

    // Far away: a position update, but no "head to pickup" yet.
    setVan(FAR.lat, FAR.lng);
    await broadcastRunLocation(run);
    let joined = res.writes.join("");
    expect(joined).toContain("event: van_location");
    expect(joined).not.toContain("event: head_to_pickup");

    // Van arrives near the pickup → alert fires.
    setVan(PICKUP.lat, PICKUP.lng);
    await broadcastRunLocation(run);
    joined = res.writes.join("");
    expect(joined).toContain("event: head_to_pickup");

    const booking = await Booking.findById(bookingId);
    expect(booking?.pickupAlertSent).toBe(true);

    // A later tick does not re-send the alert.
    const countBefore = res.writes.filter((w: string) =>
      w.includes("event: head_to_pickup"),
    ).length;
    await broadcastRunLocation(run);
    const countAfter = res.writes.filter((w: string) =>
      w.includes("event: head_to_pickup"),
    ).length;
    expect(countAfter).toBe(countBefore);
  });
});
