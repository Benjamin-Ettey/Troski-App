const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverWallet",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    mobileMoneyNetwork: {
      type: String,
      enum: ["mtn", "vodafone", "tigo"],
      required: true,
    },

    mobileMoneyNumber: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
    },

    processedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const WithdrawalRequest = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
module.exports = WithdrawalRequest;
