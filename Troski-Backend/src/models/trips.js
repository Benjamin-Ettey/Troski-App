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
    // pickupLocation is the cluster centroid (Mode A) and only exists for
    // legacy trips OR while bookings still cluster. In the new model where
    // the driver starts a Trip alone with a destination, pickupLocation is
    // null until passengers join.
    pickupLocation: { type: locationSchema, required: false, default: null },
    pickupRadiusMeters: {
      type: Number,
      default: rideConfig.CLUSTER_RADIUS_METERS,
    },

    // The driver's destination. In the new model this is set at /go-online.
    dropoffLocation: { type: locationSchema, required: true },

    // Cached Google Directions route (start → destination), fetched once at
    // /go-online. Used for enroute matching + per-passenger fare distance
    // without further API calls. Null if Directions was unavailable (we
    // then fall back to the straight-line heuristic).
    routePolyline: { type: String, default: null },
    routeDistanceKm: { type: Number, default: null },
    routeDurationMinutes: { type: Number, default: null },

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
    activeBookingCount: { type: Number, default: 0 }, // app bookings only

    // Non-app passengers the driver picked up off the street (paid cash).
    // Driver maintains this with +/- buttons in the driver app. Used to
    // compute remainingSeats = capacity - activeBookingCount - walkOnCount.
    walkOnCount: { type: Number, default: 0, min: 0 },

    // ----- Status -----
    // NEW MODEL (driver-initiated):
    //   open         — driver is online with destination, has seats, visible on map
    //   in_progress  — driver has at least one onboarded passenger / is en route
    //   completed    — driver pressed "End trip" or reached destination
    //   cancelled    — driver went offline / aborted
    //
    // LEGACY (demand-aggregation) values kept temporarily so the existing
    // tripController boots while we phase in the new model:
    //   forming, open_for_drivers, driver_assigned, at_pickup
    status: {
      type: String,
      enum: [
        "open",
        "in_progress",
        "completed",
        "cancelled",
        // legacy:
        "forming",
        "open_for_drivers",
        "driver_assigned",
        "at_pickup",
      ],
      default: "forming",
      index: true,
    },

    // ----- Pricing (per-passenger; populated when fare model is decided) -----
    farePerPassenger: { type: Number, default: null },

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
