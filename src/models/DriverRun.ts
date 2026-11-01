import mongoose from "mongoose";

const EndpointSchema = new mongoose.Schema(
  {
    town: { type: String, required: true, trim: true },
    zoneId: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false },
);

const DriverRunSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfile",
      required: true,
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
    },

    origin: { type: EndpointSchema, required: true },
    destination: { type: EndpointSchema, required: true },

    /* Best-effort route geometry from the maps provider (null when unavailable,
    e.g. no Google key). Phase 4 uses this to place pickup points on the route. */
    routePolyline: { type: String, default: null },
    routeDistanceKm: { type: Number, default: null },

    currentLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },

    availableSeats: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 1 },

    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },

    startedAt: { type: Date },
    endedAt: { type: Date },
    lastLocationAt: { type: Date },
  },
  { timestamps: true },
);

DriverRunSchema.index({ currentLocation: "2dsphere" });

DriverRunSchema.index(
  { driver: 1 },
  { unique: true, partialFilterExpression: { status: "active" } },
);

export default mongoose.model("DriverRun", DriverRunSchema);
