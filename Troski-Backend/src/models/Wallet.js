const mongoose = require("mongoose");

// One unified wallet per user. Shared across roles — if a user is both
// passenger AND driver, they have a single Wallet keyed by their user _id
// (and unique on phoneNumber).
//
// Passenger actions move funds balance → escrowBalance.
// Driver payouts add to balance.
// Withdrawals drain balance.
// balanceHash is an HMAC over (balance:escrowBalance:phoneNumber) using
// WALLET_HASH_SECRET. Verified + regenerated on every change.

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger", // unified user collection
      required: true,
      unique: true,
    },
    phoneNumber: { type: String, required: true, unique: true },

    balance: { type: Number, default: 0 },
    escrowBalance: { type: Number, default: 0 },

    balanceHash: { type: String, required: true },
  },
  { timestamps: true },
);

// Strip sensitive fields from JSON serialization. Clients fetch balance
// through dedicated endpoints (after PIN verification).
walletSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.balance;
  delete obj.escrowBalance;
  delete obj.balanceHash;
  return obj;
};

module.exports = mongoose.model("Wallet", walletSchema);
