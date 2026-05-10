const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },

    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger",
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "GHS",
    },

    // Platform commission (15%)
    commission: {
      type: Number,
      required: true,
    },

    // What the driver receives after commission
    driverEarnings: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "mobile_money", "card"],
      required: true,
    },

    // Mobile money specifics
    mobileMoneyNetwork: {
      type: String,
      enum: ["mtn", "vodafone", "tigo"],
    },

    mobileMoneyNumber: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
    },

    // Paystack fields
    paystackReference: {
      type: String,
      unique: true,
      sparse: true,
    },

    paystackTransactionId: {
      type: String,
    },

    authorizationURL: {
      type: String,
    },

    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
