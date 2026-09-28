import mongoose from "mongoose";

// One row per driver payout attempt (a wallet sweep to MoMo via Paystack).
const WithdrawalSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfile",
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

    // Our idempotency key, also sent to Paystack as the transfer reference.
    reference: {
      type: String,
      required: true,
      unique: true,
    },

    recipientCode: {
      type: String,
    },

    transferCode: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "success", "failed", "reversed"],
      default: "pending",
    },

    failureReason: {
      type: String,
    },
  },
  { timestamps: true },
);

WithdrawalSchema.index({ driver: 1, createdAt: -1 });

export default mongoose.model("Withdrawal", WithdrawalSchema);
