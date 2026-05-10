const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      unique: true,
    },

    // Funds ready for withdrawal
    availableBalance: {
      type: Number,
      default: 0,
    },

    // Earnings from rides still being processed
    pendingBalance: {
      type: Number,
      default: 0,
    },

    totalEarned: {
      type: Number,
      default: 0,
    },

    totalWithdrawn: {
      type: Number,
      default: 0,
    },

    totalCommissionPaid: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const DriverWallet = mongoose.model("DriverWallet", walletSchema);
module.exports = DriverWallet;
