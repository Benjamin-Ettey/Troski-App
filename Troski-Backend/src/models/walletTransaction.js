const mongoose = require("mongoose");

// Per-wallet line-item ledger. One row for every credit or debit, with
// balance snapshots before/after. This is the user-facing "statement" view.
//
// Differs from Transaction.js (system-wide ledger) in two ways:
//   - bound to a specific Wallet, not just a Trip-level event
//   - carries balanceBefore / balanceAfter for easy auditing
//
// Used for passengers, drivers, top-ups, payouts — anywhere a user's
// visible balance changes.

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
      ref: "Passenger",
      required: true,
      index: true,
    },

    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },

    // Free-form: a Paystack reference for top-ups, internal ID for escrow, etc.
    reference: { type: String },

    // Optional links back to the trip/booking that caused this row.
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },

    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
