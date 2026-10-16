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

// A driver's live run: they declare a fixed route (origin -> destination), go
// online, share GPS, and keep their available-seat count current. The matcher
// (Phase 4) searches these by proximity + destination + seats.
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

    // Best-effort route geometry from the maps provider (null when unavailable,
    // e.g. no Google key). Phase 4 uses this to place pickup points on the route.
    routePolyline: { type: String, default: null },
    routeDistanceKm: { type: Number, default: null },

    // Live position as GeoJSON for MongoDB's 2dsphere proximity search.
    // IMPORTANT: GeoJSON coordinate order is [longitude, latitude] — lng FIRST.
    // Getting this backwards returns wrong results with NO error, so always
    // store [lng, lat]. The 2dsphere index (below) lets us answer "which active
    // vans are within X km of this passenger?" quickly and on a real (spherical)
    // Earth, instead of scanning every run.
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

// Geospatial index: required for the $near proximity search in findNearbyRuns.
// Without it, $near errors. MongoDB (not Google) builds and uses this.
DriverRunSchema.index({ currentLocation: "2dsphere" });

// Uniqueness constraint (not geo): a driver may have at most one run whose
// status is "active", enforced by the DB even under a race. Stale runs are
// auto-ended by endStaleRuns(), and the matcher also filters by lastLocationAt
// freshness so a frozen position is never matched.
DriverRunSchema.index(
  { driver: 1 },
  { unique: true, partialFilterExpression: { status: "active" } },
);

export default mongoose.model("DriverRun", DriverRunSchema);
