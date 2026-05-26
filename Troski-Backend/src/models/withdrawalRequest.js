const mongoose = require("mongoose");

// Driver requests to cash out earnings from their unified Wallet balance
// to a mobile-money number. An admin (or automated job) reviews and
// either processes the transfer via Paystack Transfer API or rejects.

const withdrawalRequestSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger",
      required: true,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },

    amount: { type: Number, required: true },

    mobileMoneyNetwork: {
      type: String,
      enum: ["mtn", "vodafone", "tigo"],
      required: true,
    },
    mobileMoneyNumber: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
      index: true,
    },

    rejectionReason: { type: String },
    processedAt: { type: Date },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    payoutReference: { type: String, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
