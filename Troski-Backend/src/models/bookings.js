const mongoose = require("mongoose");

// A Booking is ONE PASSENGER's seat in a Trip.
//
// Two ways to start a Booking:
//   - "direct" (Mode B): passenger taps a driver's pin on the map and
//     requests a seat on that specific Trip. trip is set immediately.
//   - "cluster" (Mode A): passenger places an open request. trip is null
//     until either the system forwards them to a nearby existing Trip
//     (becoming a direct request behind the scenes) OR they get pooled
//     with other passengers in the same cluster and 5+ accepts the
//     batch — at which point trip gets set on every booking in the cluster.

const bookingSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      // Optional: null while a "cluster" booking is unassigned (no driver yet).
      // Set to the Trip _id once a driver claims it.
      required: false,
      default: null,
      index: true,
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger", // unified user collection
      required: true,
      index: true,
    },

    // The passenger's actual pickup pin.
    requestedPickup: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },

    // The passenger's OWN drop-off (may be enroute to the trip's final
    // destination — they pay only for the distance they travel). Validated
    // to be on the trip's route at request time.
    dropoffLocation: {
      name: { type: String, default: null },
      latitude: { type: Number },
      longitude: { type: Number },
    },

    // Along-route distance from this passenger's pickup to their drop-off,
    // used to compute their fare. Snapshotted at request time.
    fareDistanceKm: { type: Number, default: null },

    // How this booking entered the system.
    //   "direct"  — passenger picked a specific driver on the map (Mode B)
    //   "cluster" — passenger placed an open request, system pooled them (Mode A)
    mode: {
      type: String,
      enum: ["direct", "cluster"],
      default: "direct",
      index: true,
    },

    // 4-digit code generated on driver acceptance. The passenger enters
    // this in their own app at pickup to mark themselves as onboard, which
    // gives the driver a system-level confirmation (in addition to the
    // visual photo-match check). Cleared once onboard.
    bookingCode: { type: String, default: null },

    status: {
      type: String,
      enum: [
        // new model:
        "awaiting_payment", // paystack-paid: waiting for charge.success webhook
        "unassigned", // cluster booking with no Trip yet
        "pending", // direct request awaiting driver decision
        "accepted", // driver accepted; passenger heading to pickup
        "onboard", // passenger physically in the vehicle
        "arrived", // passenger reached their stop / dropped off
        "rejected", // driver rejected the direct request
        // legacy:
        "active",
        "completed",
        "cancelled",
        "no_show",
      ],
      default: "active",
      index: true,
    },

    // ----- Pricing snapshot at booking creation -----
    fareAmount: { type: Number, default: null },
    // Per-passenger snapshot of the payout split, computed at request time
    // so settlement uses frozen numbers even if zonesConfig changes later.
    driverPayAmount: { type: Number, default: null },
    platformProfitAmount: { type: Number, default: null },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "held", "paid", "refunded", "partially_refunded"],
      default: "unpaid",
    },

    // "wallet"   — held from passenger.wallet.balance → escrowBalance
    // "paystack" — charged from passenger's MoMo into our Paystack account
    paymentMethod: {
      type: String,
      enum: ["wallet", "paystack"],
      default: "wallet",
    },

    // Paystack charge reference (only set when paymentMethod === "paystack").
    // Lets the webhook find the Booking when charge.success arrives.
    paystackChargeReference: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },

    // ----- Lifecycle timestamps -----
    acceptedAt: { type: Date, default: null },
    onboardedAt: { type: Date, default: null },
    arrivedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
    completedAt: { type: Date, default: null }, // legacy
  },
  { timestamps: true },
);

// A passenger can only have ONE active booking at any moment. "Active" here
// means any status that ties up the passenger's escrow or commits them to a
// pickup. Cancelled / arrived / rejected bookings don't count.
bookingSchema.index(
  { passenger: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: [
          "awaiting_payment",
          "unassigned",
          "pending",
          "accepted",
          "onboard",
          "active",
        ],
      },
    },
  },
);

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
