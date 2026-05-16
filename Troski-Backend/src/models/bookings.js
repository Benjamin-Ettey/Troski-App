const mongoose = require("mongoose");

// A Booking is ONE PASSENGER's seat in a Trip. When a passenger places
// a ride order, we either:
//   - attach their Booking to an existing Trip (same dropoff + nearby
//     pickup, status forming/open_for_drivers/driver_assigned, under capacity)
//   - or create a new Trip in "forming" status with this Booking as the
//     first member.

const bookingSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger", // unified user collection
      required: true,
      index: true,
    },

    // The passenger's actual pickup pin. May be slightly off from the
    // trip's centroid (centroid is the meeting point everyone walks to).
    requestedPickup: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },

    status: {
      type: String,
      enum: ["active", "cancelled", "completed", "no_show"],
      default: "active",
      index: true,
    },

    // ----- Pricing snapshot at time of booking -----
    fareAmount: { type: Number, default: null },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "held", "paid", "refunded"],
      default: "unpaid",
    },

    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// A passenger can only have one ACTIVE booking at a time in a given trip.
// (They could have multiple historical bookings for the same trip if they
// cancelled and re-joined.)
bookingSchema.index(
  { trip: 1, passenger: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } },
);

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
