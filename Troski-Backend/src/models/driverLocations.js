const mongoose = require("mongoose");

// Live driver location. One document per driver. Updated frequently via
// socket events (and the HTTP /driver-location endpoint as a fallback).
// We keep this separate from the Driver profile so the Driver doc stays
// stable and we can index location for geo queries.

const driverLocationSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
    unique: true,
    index: true,
  },

  latitude: { type: Number },
  longitude: { type: Number },
  heading: { type: Number, default: null },
  speed: { type: Number, default: null },

  isOnline: { type: Boolean, default: false, index: true },
  socketId: { type: String, default: null },

  // The destination the driver is currently heading to (set on /go-online,
  // cleared on /go-offline). Used by the passenger "nearby trotros" query
  // to filter to drivers whose route matches the passenger's destination.
  destination: {
    name: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },

  // The active Trip for this driver session (created at /go-online).
  activeTrip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trip",
    default: null,
  },

  // Updated on every location push. Used to detect stale entries.
  lastUpdate: { type: Date, default: Date.now, index: true },
});

const DriverLocation = mongoose.model("DriverLocation", driverLocationSchema);
module.exports = DriverLocation;
