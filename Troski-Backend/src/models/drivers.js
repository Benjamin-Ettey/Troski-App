const mongoose = require("mongoose");

// DRIVER PROFILE.
// A 1:1 extension of a User (Passenger). Created when an admin approves a
// DriverApplication. Holds all driver-specific identity, document, and
// operational state. The base identity (name, phone, email) stays on the
// linked User document — look it up via `populate('user')`.
//
// Vehicle.driver and Ride.driver reference _this_ Driver document, not the
// underlying User. To go from a Ride to the human's phone number you do
// ride.driver -> driver.user -> user.phoneNumber.

const driverSchema = new mongoose.Schema(
  {
    // 1:1 link to the user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger",
      required: true,
      unique: true,
      index: true,
    },

    // ----- Identity (copied from the approved DriverApplication) -----
    licenseID: { type: String, required: true, unique: true },
    ghanaCardNumber: { type: String, required: true, unique: true },
    ghanaCardImage: { type: String, required: true },
    ghanaCardImagePublicId: { type: String, required: true },
    licenseImage: { type: String, required: true },
    licenseImagePublicId: { type: String, required: true },
    city: { type: String, required: true },

    // ----- Vehicle -----
    // A driver registers their vehicle separately, post-approval, via the
    // driver app. Until then this is null and the driver cannot go online.
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },

    // ----- Operational state -----
    // Online status + live GPS live in the DriverLocation collection
    // (separate, indexed for geo queries). This doc only tracks the active
    // trip reference.
    activeTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },

    // ----- Financials -----
    totalEarnings: { type: Number, default: 0 },
    completedTrips: { type: Number, default: 0 },
    cancelledTrips: { type: Number, default: 0 },

    // ----- Approval audit trail -----
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverApplication",
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    approvedAt: { type: Date },
  },
  { timestamps: true },
);

driverSchema.methods.canGoOnline = function () {
  return !!this.vehicle;
};

const Driver = mongoose.model("Driver", driverSchema);
module.exports = Driver;
