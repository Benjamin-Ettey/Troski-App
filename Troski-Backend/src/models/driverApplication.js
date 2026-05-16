const mongoose = require("mongoose");

const driverApplicationSchema = new mongoose.Schema(
  {
    // The user who is applying to drive. Must already exist and be
    // phone-verified.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger", // unified user collection
      required: true,
      index: true,
    },

    // Identity / licensing
    licenseID: { type: String, required: true, trim: true, uppercase: true },
    ghanaCardNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    city: { type: String, required: true },

    // Document images (Cloudinary)
    ghanaCardImage: { type: String, required: true },
    ghanaCardImagePublicId: { type: String, required: true },
    licenseImage: { type: String, required: true },
    licenseImagePublicId: { type: String, required: true },

    // Review state
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: null },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// A user can only have one application at a time in pending or approved state.
// Rejected applications are kept for audit but allow the user to re-apply.
driverApplicationSchema.index(
  { user: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "approved"] } } },
);

const DriverApplication = mongoose.model(
  "DriverApplication",
  driverApplicationSchema,
);
module.exports = DriverApplication;
