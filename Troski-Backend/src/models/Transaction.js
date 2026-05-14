const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
    },

    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    amount: Number,

    commission: Number,

    type: {
      type: String,
      enum: [
        "wallet_topup",
        "escrow_hold",
        "driver_payout",
        "refund",
        "withdrawal",
        "cancellation_fee",
      ],
    },

    status: {
      type: String,
      enum: ["pending", "held", "completed", "failed", "refunded"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Transaction", transactionSchema);
