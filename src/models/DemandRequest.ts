import mongoose from "mongoose";

const DemandRequestSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    pickup: {
      zoneId: { type: String },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },

    destination: {
      town: { type: String },
      zoneId: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },

    // H3 cell of the pickup at the demand resolution — the clustering key.
    originH3: { type: String, required: true, index: true },

    seats: { type: Number, default: 1 },

    status: {
      type: String,
      enum: ["pending", "clustered", "served", "expired", "cancelled"],
      default: "pending",
      index: true,
    },

    cluster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DemandCluster",
      default: null,
    },
  },
  { timestamps: true },
);

DemandRequestSchema.index({ status: 1, "destination.zoneId": 1, createdAt: -1 });

export default mongoose.model("DemandRequest", DemandRequestSchema);
