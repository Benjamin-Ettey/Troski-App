const mongoose = require("mongoose");

const driverLocationSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },

    latitude: Number,

    longitude: Number,

    isOnline: {
      type: Boolean,
      default: true,
    },

    socketId: { type: String },

    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("DriverLocation", driverLocationSchema);
