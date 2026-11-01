import mongoose from "mongoose";

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
