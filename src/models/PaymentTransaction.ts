import mongoose from "mongoose";

// One row per passenger charge for a ride. Tracks both the Paystack payment
// state (status) and our escrow bookkeeping state (escrowStatus).
const PaymentTransactionSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "GHS",
    },

    // Our reference, also sent to Paystack; the join key across systems.
    reference: {
      type: String,
      required: true,
      unique: true,
    },

    method: {
      type: String,
      enum: ["momo", "card"],
    },

    // Paystack's view of the payment.
    status: {
      type: String,
      enum: ["pending", "success", "failed", "abandoned"],
      default: "pending",
    },

    // Our escrow lifecycle for these funds.
    escrowStatus: {
      type: String,
      enum: [
        "none",
        "processing",
        "held",
        "releasing",
        "released",
        "refunding",
        "refunded",
      ],
      default: "none",
    },

    paystack: {
      channel: { type: String },
      gatewayResponse: { type: String },
      paidAt: { type: String },
      customerEmail: { type: String },
    },

    // Links to the ledger posting that placed these funds into escrow.
    ledgerPostingId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true },
);

PaymentTransactionSchema.index({ booking: 1 });
PaymentTransactionSchema.index({ passenger: 1, createdAt: -1 });

export default mongoose.model("PaymentTransaction", PaymentTransactionSchema);
