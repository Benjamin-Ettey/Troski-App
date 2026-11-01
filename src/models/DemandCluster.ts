import mongoose from "mongoose";

const DemandClusterSchema = new mongoose.Schema(
  {
    destination: {
      town: { type: String },
      zoneId: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },

    /* Centre of the demand (average of pickups) as GeoJSON for proximity search
    by nearby drivers. */
    centroid: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },

    requests: [{ type: mongoose.Schema.Types.ObjectId, ref: "DemandRequest" }],

    passengerCount: { type: Number, required: true },
    totalSeats: { type: Number, required: true },

    status: {
      type: String,
      enum: ["open", "accepted", "expired"],
      default: "open",
      index: true,
    },

    // Set when a driver accepts the cluster.
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfile",
      default: null,
    },
    run: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverRun",
      default: null,
    },
    acceptedAt: { type: Date },
  },
  { timestamps: true },
);

DemandClusterSchema.index({ centroid: "2dsphere" });

export default mongoose.model("DemandCluster", DemandClusterSchema);
