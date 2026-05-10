const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger",
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },

    pickupLocation: {
      type: String,
      required: true,
    },

    dropoffLocation: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["requested", "accepted", "in_progress", "completed", "cancelled"],
      default: "requested",
    },

    pickupLatitude: { type: Number, required: true },
    pickupLongitude: { type: Number, required: true },
    dropoffLatitude: { type: Number, required: true },
    dropoffLongitude: { type: Number, required: true },

    // Fare & distance (populated on ride completion)
    estimatedFare: { type: Number },
    fare: { type: Number },
    distance: { type: Number }, // kilometres
    duration: { type: Number }, // minutes

    // Payment info
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "mobile_money", "card"],
      default: "mobile_money",
    },

    cancellationReason: { type: String },

    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const Ride = mongoose.model("Ride", rideSchema);
module.exports = Ride;
