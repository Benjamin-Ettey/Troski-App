import mongoose from "mongoose";

// Immutable double-entry ledger line. Entries are never updated or deleted;
// corrections are made with new (reversing) postings. Each carries the hash
// chain fields for tamper-evidence.
const LedgerEntrySchema = new mongoose.Schema(
  {
    // Groups the entries of a single balanced posting together.
    postingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Business meaning of the posting: charge | release | refund | payout | adjustment | reversal
    type: {
      type: String,
      required: true,
    },

    account: {
      type: String,
      required: true,
      index: true,
    },

    accountType: {
      type: String,
      enum: ["asset", "liability", "revenue", "expense"],
      required: true,
    },

    direction: {
      type: String,
      enum: ["debit", "credit"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "GHS",
    },

    // The account's balance immediately after this entry was applied.
    balanceAfter: {
      type: Number,
      required: true,
    },

    // What this posting relates to (e.g. { kind: "booking", id: "<id>" }).
    reference: {
      kind: { type: String },
      id: { type: String },
    },

    meta: {
      type: mongoose.Schema.Types.Mixed,
    },

    prevHash: {
      type: String,
      default: null,
    },

    hash: {
      type: String,
      required: true,
    },

    // Set explicitly (not via timestamps) because it is part of the hash.
    createdAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: false },
);

// Per-account chain replay order.
LedgerEntrySchema.index({ account: 1, createdAt: 1, _id: 1 });

export default mongoose.model("LedgerEntry", LedgerEntrySchema);
