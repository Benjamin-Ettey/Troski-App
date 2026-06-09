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
    // ----- Identity (all set at sign-up) -----
    name: { type: String, required: true },

    // Display name. Lowercased + unique. Editable later via
    // PATCH /passenger/me/username.
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [
        /^[a-z0-9._]+$/,
        "username can only contain lowercase letters, numbers, dots, and underscores",
      ],
    },

    phoneNumber: { type: String, unique: true, required: true },
    email: { type: String, required: true, unique: true },
    pinCode: { type: String, default: null },
    dateOfBirth: { type: Date, required: true },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    // ----- Roles -----
    roles: {
      type: [String],
      enum: ["passenger", "driver"],
      default: ["passenger"],
    },
    
    profilePhoto: { type: String, default: null },
    profilePhotoPublicId: { type: String, default: null },

    // ----- Verification flags -----
    isPhoneVerified: { type: Boolean, default: false },

    // True once the user has finished the REQUIRED onboarding:
    //   identity fields + OTP-verified + PIN set + photo uploaded.
    // Trip booking and driver-application endpoints check this and refuse
    // if false. Set to true at /auth/upload-photo.
    isOnboardingComplete: { type: Boolean, default: false },

    // True if the OPTIONAL extras have been filled (emergency contact, etc.).
    // Not gating anything — purely informational.
    isProfileComplete: { type: Boolean, default: false },

    // ----- OTP state (sign-up + login) -----
    otpCode: { type: String },
    otpExpiresAt: { type: Date },

    // ----- Pending email / phone change (step-up auth) -----
    // When the user requests an email or phone change, the proposed value
    // sits here with an OTP. Confirmed via /me/change-email/verify or
    // /me/change-phone/verify, at which point we swap the real field and
    // clear the pending one.
    pendingEmail: {
      value: { type: String, default: null },
      otpCode: { type: String, default: null }, // hashed
      otpExpiresAt: { type: Date, default: null },
    },
    pendingPhoneNumber: {
      value: { type: String, default: null },
      otpCode: { type: String, default: null }, // hashed
      otpExpiresAt: { type: Date, default: null },
    },

    // ----- Forgot-PIN recovery -----
    // OTP issued by POST /auth/forgot-pin/start; consumed by
    // /auth/forgot-pin/reset. Separate from the login OTP slot so a
    // simultaneous login attempt doesn't clobber the reset request.
    pinResetOtp: {
      code: { type: String, default: null }, // hashed
      expiresAt: { type: Date, default: null },
    },
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

// Strip all sensitive / internal-only fields before returning the user
// over the wire. Anything stored for security plumbing (PIN, OTPs,
// pending change requests) is hidden — only safe, displayable fields
// reach the client.
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.pinCode;
  delete obj.otpCode;
  delete obj.otpExpiresAt;
  delete obj.pendingEmail;
  delete obj.pendingPhoneNumber;
  delete obj.pinResetOtp;
  delete obj.__v;
  return obj;
};

const Passenger = mongoose.model("Passenger", userSchema);
module.exports = Passenger;
