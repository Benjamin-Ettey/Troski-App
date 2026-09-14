import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
    },

    email: { type: String },

    otpHash: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: [
        "signup",
        "login",
        "reset_pin",
        "change_phone",
        "sensitive_transaction",
      ],
      required: true,
    },

    deliveryMethod: { 
      type: String,
      enum: ["sms", "email"],
      required: true
    },

    attemptCount: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Automatically delete expired OTPs from the database after a certain time
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", OtpSchema);
