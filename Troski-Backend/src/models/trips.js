const mongoose = require("mongoose");
const rideConfig = require("../config/rideConfig");

// A Trip is a SHARED RIDE. One driver, one vehicle, one route (pickup
// cluster → dropoff station), N passengers.
//
// Passengers don't have a Ride document of their own — each passenger has
// a Booking that references the Trip they're in. See models/bookings.js.
//
// Trip lifecycle:
//   forming           — < MIN_PASSENGERS bookings. Hidden from drivers.
//                       Passengers see a live counter. Auto-cancels if
//                       it doesn't reach threshold within FORMING_TIMEOUT.
//   open_for_drivers  — Threshold reached. Visible to nearby drivers
//                       whose route preferences include this dropoff.
//   driver_assigned   — A driver accepted. They're heading to pickup.
//                       New passengers can still join up to vehicle capacity.
//   at_pickup         — Driver arrived at the pickup centroid. Group is
//                       locked from new joiners. Driver waits/boards.
//   in_progress       — Vehicle in motion toward dropoff.
//   completed         — Reached dropoff (or driver/passengers confirmed).
//   cancelled         — Aborted; refunds processed for affected bookings.

const locationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    name: { type: String, trim: true }, // e.g. "Tema Station"
  },
  { _id: false },
);

const tripSchema = new mongoose.Schema(
  {
    // ----- Where -----
    // Pickup is the CENTROID of the passenger cluster. Recomputed as
    // bookings join/leave (while still in forming / open_for_drivers).
    pickupLocation: { type: locationSchema, required: true },
    pickupRadiusMeters: {
      type: Number,
      default: rideConfig.CLUSTER_RADIUS_METERS,
    },

    // Dropoff is a named destination. Trips with the same dropoffName +
    // overlapping pickup clusters are eligible to merge — but for v1 we
    // do strict same-name matching, no fuzzy.
    dropoffLocation: { type: locationSchema, required: true },

    // ----- Who -----
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },

    // ----- Capacity & threshold -----
    minPassengers: {
      type: Number,
      default: rideConfig.MIN_PASSENGERS_FOR_DRIVERS,
    },
    capacity: { type: Number, default: null }, // filled from vehicle on accept
    activeBookingCount: { type: Number, default: 0 }, // denormalized for fast checks

    // ----- Status -----
    status: {
      type: String,
      enum: [
        "forming",
        "open_for_drivers",
        "driver_assigned",
        "at_pickup",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "forming",
      index: true,
    },

    // ----- Pricing (per-passenger snapshot, locked at trip creation) -----
    // All bookings in a trip pay the same fare, calculated once from the
    // first passenger's pickup/dropoff and frozen. We snapshot the split
    // so payout amounts don't shift if zonesConfig changes later.
    farePerPassenger: { type: Number, default: null }, // what each passenger pays
    driverPayPerPassenger: { type: Number, default: null }, // driver's cut per seat
    platformProfitPerPassenger: { type: Number, default: null }, // platform's cut per seat
    pickupZone: { type: String, default: null },
    dropoffZone: { type: String, default: null },

    // ----- Lifecycle timestamps -----
    openedAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    arrivedAtPickupAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    cancellationReason: { type: String, default: null },
    cancelledBy: {
      type: String,
      enum: ["driver", "system", "all_passengers_left", null],
      default: null,
    },
  },
  { timestamps: true },
);

// Compound index that supports the "find a trip to join" query: for a given
// dropoff name and a forming/open trip, we filter by status and then by
// proximity in code.
tripSchema.index({ "dropoffLocation.name": 1, status: 1 });

// Geo index on pickup centroid for nearby-driver queries (driver sees trips
// near them). Mongoose 2dsphere needs a GeoJSON Point, but we store
// lat/lng separately. For v1 we'll do in-memory distance filtering — at
// our expected volume (10s of active trips) it's fine. Add a geo index
// later if needed.

const Trip = mongoose.model("Trip", tripSchema);
module.exports = Trip;
