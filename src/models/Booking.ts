import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema(
  {
    town: { type: String, required: true, trim: true },
    zoneId: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false },
);

const BookingSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The DriverProfile that accepted the request. Null until a driver accepts.
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfile",
      default: null,
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },

    // The live run (Phase 4) this booking was matched to.
    run: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverRun",
      default: null,
      index:true
    },

    pickup: { type: LocationSchema, required: true },
    destination: { type: LocationSchema, required: true },

    // The junction/point on the van's route the passenger walks to, plus the
    // van's ETA there at match time.
    pickupPoint: {
      name: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    etaMinutes: { type: Number, default: null },

    // Set once the "head to pickup" alert has been pushed, so it fires only once.
    pickupAlertSent: { type: Boolean, default: false },

    distanceKm: { type: Number, required: true },

    seatsRequested: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    // Snapshot of the fare at request time. fareFinal is set on completion.
    fareEstimate: { type: Number, required: true },
    fareFinal: { type: Number, default: null },

    status: {
      type: String,
      enum: [
        "requested",
        "accepted",
        "arrived",
        "in_progress",
        "completed",
        "cancelled",
        "expired",
        "no_drivers",
      ],
      default: "requested",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "momo"],
      default: "cash",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "escrow_held", "released", "refunded", "failed"],
      default: "pending",
    },

    cancellation: {
      by: { type: String, enum: ["passenger", "driver", "system"] },
      reason: { type: String, trim: true },
      at: { type: Date },
    },

    // Lifecycle timestamps for analytics and dispute resolution.
    acceptedAt: { type: Date },
    arrivedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

// Drivers poll for open requests by zone; passengers/drivers list their own trips.
BookingSchema.index({ status: 1, "pickup.zoneId": 1, "destination.zoneId": 1 });
BookingSchema.index({ passenger: 1, createdAt: -1 });
BookingSchema.index({ driver: 1, createdAt: -1 });

export default mongoose.model("Booking", BookingSchema);
