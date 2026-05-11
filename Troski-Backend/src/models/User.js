const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    username: { type: String, sparse: true }, // Keep sparse for admin
    // Remove 'unique: true' from phoneNumber
    phoneNumber: {
      type: String,
      sparse: true,
    },
    email: { type: String },
    city: { type: String },
    pinCode: { type: String },
    password: { type: String },
    role: {
      type: String,
      enum: ["passenger", "driver", "admin"],
      required: true,
    },
    // Driver Specific
    licenseID: { type: String, sparse: true },

    ghanaCardNumber: { type: String, sparse: true },

    ghanaCardImage: String,
    ghanaCardImagePublicId: String,

    licenseImage: String,
    licenseImagePublicId: String,

    // totalEarnings: { type: Number, default: 0 },

    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },

    currentLatitude: Number,
    currentLongitude: Number,

    lastLocationUpdate: Date,

    otpCode: String,
    otpExpiresAt: Date,

    isPhoneVerified: { type: Boolean, default: false },

    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// =====================================
// COMPOUND INDEXES (THE FIX)
// =====================================
// This allows same phone/email for DIFFERENT roles, but unique for SAME roles
userSchema.index({ phoneNumber: 1, role: 1 }, { unique: true });
userSchema.index({ email: 1, role: 1 }, { unique: true });

// Existing logic for password hashing and methods remain the same...
userSchema.pre("save", async function () {
  if (!this.isModified("pinCode") && !this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  if (this.pinCode) this.pinCode = await bcrypt.hash(this.pinCode, salt);
  if (this.password) this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePinCode = async function (candidatePinCode) {
  return await bcrypt.compare(candidatePinCode, this.pinCode);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.pinCode;
  delete obj.password;
  delete obj.otpCode;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
