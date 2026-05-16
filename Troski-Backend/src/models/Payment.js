const mongoose = require("mongoose");

// Payment record. Two flavors, discriminated by `paymentType`:
//   "ride_payment"  — escrow hold + release for a passenger's Booking
//                     (one Payment per Booking, not per Trip).
//   "wallet_topup"  — passenger added funds via Paystack.
//
// For a top-up, `booking` is null. For a ride payment, `booking` points at
// the specific Booking (and `trip` is denormalized for easy lookups).

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: false,
    },

    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: false,
    },

    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger", // unified user collection
      required: true,
    },

    paymentType: {
      type: String,
      enum: ["ride_payment", "wallet_topup"],
      required: true,
    },

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

    // Lifecycle markers used by the escrow release flow.
    escrowReleased: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
