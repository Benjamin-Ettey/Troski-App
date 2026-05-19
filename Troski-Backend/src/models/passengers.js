const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// USER collection.
// Model name stays "Passenger" so existing refs in Ride/Wallet/etc. continue
// to work — but conceptually this is the unified user table. Every user
// (passenger AND driver) has exactly one document here.
//
// A user starts with roles = ['passenger']. When their DriverApplication is
// approved, an admin appends 'driver' to roles AND creates a linked Driver
// document (see ../models/drivers.js) that holds all driver-specific data.
// This model intentionally knows NOTHING about licenses, vehicles, or
// driver location — that lives on the Driver profile.

const userSchema = new mongoose.Schema(
  {
    // ----- Identity (set at sign-up) -----
    name: { type: String, required: true },
    phoneNumber: { type: String, unique: true, required: true },
    email: { type: String, required: true },
    pinCode: { type: String, default: null },
    // Temporary holding spot for a freshly-set PIN during sign-up.
    // Set by /auth/set-pin (hashed), then compared in /auth/confirm-pin.
    // On confirm match it's promoted to `pinCode` and cleared.
    pendingPinCode: { type: String, default: null },

    // ----- Roles -----
    roles: {
      type: [String],
      enum: ["passenger", "driver"],
      default: ["passenger"],
    },

    // ----- Profile (set at /complete-profile) -----
    profilePhoto: { type: String, default: null },
    profilePhotoPublicId: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },

    // ----- Verification flags -----
    isPhoneVerified: { type: Boolean, default: false },
    isProfileComplete: { type: Boolean, default: false },

    // ----- OTP state -----
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("pinCode")) return;
  if (!this.pinCode) return;
  const salt = await bcrypt.genSalt(10);
  this.pinCode = await bcrypt.hash(this.pinCode, salt);
});

userSchema.methods.comparePinCode = async function (candidatePinCode) {
  if (!this.pinCode) return false;
  return bcrypt.compare(candidatePinCode, this.pinCode);
};

userSchema.methods.hasRole = function (role) {
  return Array.isArray(this.roles) && this.roles.includes(role);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.pinCode;
  delete obj.otpCode;
  delete obj.otpExpiresAt;
  return obj;
};

const Passenger = mongoose.model("Passenger", userSchema);
module.exports = Passenger;
