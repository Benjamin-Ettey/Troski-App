const mongoose = require("mongoose");

const driverTokenSchema = new mongoose.Schema(
  {
    refreshToken: { type: String, required: true },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    isValid: { type: Boolean, default: true },
    driver: {
      type: mongoose.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DriverToken", driverTokenSchema);
