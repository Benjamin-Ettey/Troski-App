import mongoose from "mongoose";

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
