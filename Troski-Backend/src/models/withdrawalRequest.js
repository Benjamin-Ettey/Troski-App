const mongoose = require("mongoose");

// A driver's request to cash out earnings from their Wallet balance
// to a mobile-money number. Admin (or an automated job) reviews and
// either processes the transfer or rejects with a reason.

const withdrawalRequestSchema = new mongoose.Schema(
  {
    // The driver profile that initiated the request.
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },

    // The underlying user (for convenience — Driver.user has the same _id).
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger",
      required: true,
    },

    // Unified wallet (no more separate DriverWallet).
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    mobileMoneyNetwork: {
      type: String,
      enum: ["mtn", "vodafone", "tigo"],
      required: true,
    },

    mobileMoneyNumber: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
      index: true,
    },

    rejectionReason: { type: String },
    processedAt: { type: Date },

    // Audit: which admin processed/rejected
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    // External payout reference (e.g. Paystack transfer code) once issued
    payoutReference: { type: String, default: null },
  },
  { timestamps: true },
);

const WithdrawalRequest = mongoose.model(
  "WithdrawalRequest",
  withdrawalRequestSchema,
);
module.exports = WithdrawalRequest;
