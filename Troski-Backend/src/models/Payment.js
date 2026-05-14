const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // Make ride optional because Top-ups don't have a ride ID
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: false,
    },

    // Change this to match the controller or vice versa.
    // Let's stick with 'passenger' for consistency with rides.
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Add this to identify what kind of payment this is
    paymentType: {
      type: String,
      enum: ["ride_payment", "wallet_topup"],
      required: true,
    },

    // Add phoneNumber for shared wallet lookups
    phoneNumber: {
      type: String,
      required: true,
    },

    amount: { type: Number, required: true },
    currency: { type: String, default: "GHS" },

    paymentProvider: {
      type: String,
      enum: ["paystack", "wallet"],
      default: "paystack",
    },

    // Ensure this matches what you send from the controller
    paystackReference: {
      type: String,
      unique: true,
      sparse: true,
    },

    status: {
      type: String,
      enum: ["pending", "held", "completed", "failed", "cancelled", "refunded"],
      default: "pending",
    },
    // ... other fields (driverPay, troskiProfit, etc.)
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
