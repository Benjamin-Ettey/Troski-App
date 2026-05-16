const mongoose = require("mongoose");

// Per-wallet line-item ledger. One row for every credit or debit, with
// the balance snapshot BEFORE and AFTER the change. This is the
// passenger/driver-facing "statement" view.
//
// Differs from Transaction.js (system-wide ledger) in two ways:
//   - bound to a specific Wallet (not a Trip-level event)
//   - carries balanceBefore/balanceAfter for easy auditing
//
// Used for both passenger ride payments and driver payouts/withdrawals,
// since users now share a single unified Wallet across roles.

const walletTransactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger", // unified user collection
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    // Free-form reference: a Paystack reference for top-ups, an internal
    // ID for escrow holds, etc.
    reference: {
      type: String,
    },

    // Optional links back to the trip/booking that caused this entry.
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },

    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

const WalletTransaction = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema,
);
module.exports = WalletTransaction;
