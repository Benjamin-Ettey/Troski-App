const mongoose = require("mongoose");

// System-wide money-movement ledger. Every wallet credit/debit/refund/
// payout/withdrawal writes one row here. Used for reconciliation,
// dispute resolution, and any future financial reporting.

const transactionSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },

    passenger: { type: mongoose.Schema.Types.ObjectId, ref: "Passenger" },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },

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
        "platform_fee",
      ],
    },

    status: {
      type: String,
      enum: ["pending", "held", "completed", "failed", "refunded"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Transaction", transactionSchema);
