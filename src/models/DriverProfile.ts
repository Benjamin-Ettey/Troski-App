import mongoose from "mongoose";

const DriverProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    ghanaCardNumber: {
      type: String,
    },

    ghanaCardImage: {
      type: String,
    },

    licenseNumber: {
      type: String,
    },

    licenseImage: {
      type: String,
    },

    licenseExpiryDate: {
      type: Date,
    },

    verificationStatus: {
      type: String,
      enum: ["incomplete", "pending", "approved", "rejected", "suspended"],
      default: "incomplete",
    },

    routePreferences: [
      {
        from: {
          type: String,
          required: true,
        },
        to: {
          type: String,
          required: true,
        },
      },
    ],

    momoNumber: {
      type: String,
    },

    // Mobile Money provider for payouts (MTN / Vodafone-Telecel / AirtelTigo).
    momoProvider: {
      type: String,
      enum: ["MTN", "VOD", "ATL"],
    },

    // Cached Paystack transfer recipient code, created lazily on first payout.
    transferRecipientCode: {
      type: String,
    },

    rejectionReason: {
      type: String,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeenAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

export default mongoose.model("DriverProfile", DriverProfileSchema);
