import mongoose from "mongoose";

// Idempotency + audit log for provider webhooks. dedupeKey is the request
// signature, which is identical across Paystack retries of the same event, so a
// unique index lets us skip work we've already done.
const WebhookEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: "paystack",
    },

    dedupeKey: {
      type: String,
      required: true,
      unique: true,
    },

    event: {
      type: String,
    },

    reference: {
      type: String,
    },

    processed: {
      type: Boolean,
      default: false,
    },

    processedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

export default mongoose.model("WebhookEvent", WebhookEventSchema);
