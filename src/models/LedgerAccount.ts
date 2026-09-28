import mongoose from "mongoose";

// One row per account in the chart of accounts: system accounts (escrow,
// platform_revenue, gateway) and one per driver wallet (driver_wallet:<id>).
// Holds the cached balance and the head of that account's hash chain.
const LedgerAccountSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },

    type: {
      type: String,
      enum: ["asset", "liability", "revenue", "expense"],
      required: true,
    },

    balance: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "GHS",
    },

    // Hash of the most recent ledger entry for this account (chain head).
    lastHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("LedgerAccount", LedgerAccountSchema);
