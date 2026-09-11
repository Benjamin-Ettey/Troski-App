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

    // A real selfie of the applicant. Required for new applications.
    // Admin compares this against the Ghana Card photo + license photo
    // at review time. On approval, this URL gets copied onto the user's
    // profilePhoto so passengers see the verified face.
    // (Schema-level `required` is left off for backwards-compat with any
    // existing pre-feature applications; the upload is enforced at the
    // controller level for new submissions.)
    selfieImage: { type: String, default: null },
    selfieImagePublicId: { type: String, default: null },

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

// No two ACTIVE applications can share a licenseID or ghanaCardNumber.
// Rejected applications are exempt so a (different) rejected applicant
// could resubmit later if their docs were the same person, but this catches
// two different people trying to claim the same identity.
driverApplicationSchema.index(
  { licenseID: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "approved"] } },
  },
);
driverApplicationSchema.index(
  { ghanaCardNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "approved"] } },
  },
);

const DriverApplication = mongoose.model(
  "DriverApplication",
  driverApplicationSchema,
);
module.exports = DriverApplication;
