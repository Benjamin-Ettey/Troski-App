const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    phoneNumber: {
      type: String,
      required: true,
      unique: true, // There can only ever be one wallet for this phone number
    },

    balance: {
      type: Number,
      default: 0,
    },

    escrowBalance: {
      type: Number,
      default: 0,
    },

    balanceHash: {
      type: String,
      required: true,
    }, // New field for integrity verification
  },
  {
    timestamps: true,
  },
);

walletSchema.methods.toJSON = function () {
  let obj = this.toObject();
  delete obj.balance;
  delete obj.escrowBalance;
  delete obj.balanceHash;
  return obj;
};

module.exports = mongoose.model("Wallet", walletSchema);
