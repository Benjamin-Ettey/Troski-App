const mongoose = require("mongoose");

// One wallet per user. Shared across roles: if the same person is both
// a passenger and a driver, they have a single Wallet (keyed by user _id
// and by phoneNumber). Passenger-side actions move funds into escrow;
// driver-side payouts add to balance. Withdrawals drain balance.
//
// `balanceHash` is an HMAC over (balance, escrowBalance, phoneNumber)
// using process.env.WALLET_HASH_SECRET. Every read/write must verify and
// regenerate this so direct DB tampering is detectable.

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger", // = unified user collection
      required: true,
      unique: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },

    balance: {
      type: Number,
      default: 0,
    },

    escrowBalance: {
      type: Number,
      default: 0,
    },

    balanceHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

// Strip sensitive fields from JSON serialization. Clients fetch balance
// through dedicated endpoints that do integrity verification first.
walletSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.balance;
  delete obj.escrowBalance;
  delete obj.balanceHash;
  return obj;
};

module.exports = mongoose.model("Wallet", walletSchema);
