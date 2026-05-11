const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    // =====================================
    // PASSENGER + DRIVER
    // =====================================

    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // =====================================
    // LOCATIONS
    // =====================================

    pickupLocation: {
      type: String,
      required: true,
      trim: true,
    },

    dropoffLocation: {
      type: String,
      required: true,
      trim: true,
    },

    pickupLatitude: {
      type: Number,
      required: true,
    },

    pickupLongitude: {
      type: Number,
      required: true,
    },

    dropoffLatitude: {
      type: Number,
      required: true,
    },

    dropoffLongitude: {
      type: Number,
      required: true,
    },

    // =====================================
    // LIVE DRIVER TRACKING
    // =====================================

    currentDriverLatitude: Number,

    currentDriverLongitude: Number,

    currentSpeed: {
      type: Number,
      default: 0,
    },

    // =====================================
    // DISTANCE + ZONES
    // =====================================

    distanceInKm: {
      type: Number,
      required: true,
    },

    pickupZone: {
      type: String,
      required: true,
    },

    dropoffZone: {
      type: String,
      required: true,
    },

    // =====================================
    // FARE SNAPSHOT
    // =====================================

    baseFare: {
      type: Number,
      required: true,
    },

    calculatedFare: {
      type: Number,
      required: true,
    },

    platformFee: {
      type: Number,
      required: true,
    },

    commissionAmount: {
      type: Number,
      required: true,
    },

    troskiProfit: {
      type: Number,
      required: true,
    },

    driverPay: {
      type: Number,
      required: true,
    },

    estimatedFare: {
      type: Number,
      required: true,
    },

    finalPaidFare: Number,

    // =====================================
    // ESCROW
    // =====================================

    paymentHeld: {
      type: Boolean,
      default: false,
    },

    escrowReleased: {
      type: Boolean,
      default: false,
    },

    // =====================================
    // STATUS
    // =====================================

    status: {
      type: String,
      enum: [
        "requested",
        "accepted",
        "driver_arrived",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "requested",
    },

    // =====================================
    // COMPLETION FLAGS
    // =====================================

    dropoffReached: {
      type: Boolean,
      default: false,
    },

    driverReachedPickup: {
      type: Boolean,
      default: false,
    },

    driverRequestedCompletion: {
      type: Boolean,
      default: false,
    },

    passengerConfirmedCompletion: {
      type: Boolean,
      default: false,
    },

    lowSpeedStartedAt: Date,

    // =====================================
    // TIMESTAMPS
    // =====================================

    rideStartedAt: Date,

    rideCompletedAt: Date,

    driverAcceptedAt: Date,

    driverArrivedAt: Date,

    // =====================================
    // CANCELLATION
    // =====================================

    cancelledBy: {
      type: String,
      enum: ["passenger", "driver", "system"],
    },

    cancellationReason: String,

    cancellationFee: {
      type: Number,
      default: 0,
    },

    // =====================================
    // DRIVER MATCHING
    // =====================================

    nearbyDriversNotified: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
      },
    ],

    assignedDriverDistanceKm: Number,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Ride", rideSchema);
