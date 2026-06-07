const mongoose = require("mongoose");

// In-app notification. Created by various lifecycle events (booking
// accepted, rejected, completed, vehicle approved, withdrawal processed,
// etc.) so the user has a feed when they open the app.
//
// Use the `notify()` helper in src/utils/notify.js — never create these
// directly in controllers.

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger",
      required: true,
      index: true,
    },

    // Machine-readable kind, useful for grouping / icon selection on the
    // client. Add to the enum as new event types appear.
    type: {
      type: String,
      enum: [
        "booking_accepted",
        "booking_rejected",
        "booking_cancelled",
        "booking_onboarded",
        "booking_arrived",
        "booking_payment_confirmed",
        "booking_payment_failed",
        "trip_completed",
        "trip_driver_cancelled",
        "vehicle_approved",
        "vehicle_rejected",
        "driver_application_approved",
        "driver_application_rejected",
        "wallet_topup_completed",
        "withdrawal_processed",
        "withdrawal_failed",
        "system",
      ],
      required: true,
    },

    title: { type: String, required: true },
    message: { type: String, required: true },

    // Optional refs back to the entity this is about — lets the client
    // deep-link the notification into the relevant screen.
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    relatedTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },

    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Auto-purge notifications older than 90 days. Keeps the collection small
// and the user feed relevant.
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);

module.exports = mongoose.model("Notification", notificationSchema);
