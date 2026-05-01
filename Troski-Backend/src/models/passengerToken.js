const mongoose = require("mongoose");

const passengerTokenSchema = new mongoose.Schema(
  {
    refreshToken: { type: String, required: true },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    isValid: { type: Boolean, default: true },
    passenger: {
      type: mongoose.Types.ObjectId,
      ref: "Passenger",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PassengerToken", passengerTokenSchema);
