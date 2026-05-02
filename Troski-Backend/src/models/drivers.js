const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
  },

  phoneNumber: {
    type: String,
    unique: true,
  },

  email: {
    type: String,
  },

  city: {
    type: String,
  },

  pinCode: {
    type: String,
  },

  role: {
    type: String,
    default: "driver",
  },

  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ride",
  },

  licenseID: {
    type: String,
    unique: true,
  },

  ghanaCardNumber: {
    type: String,
    unique: true,
  },

  ghanaCardImage: {
    type: String,
  },

  ghanaCardImagePublicId: {
    type: String,
  },

  licenseImage: {
    type: String,
  },

  licenseImagePublicId: {
    type: String,
  },

  totalEarnings: {
    type: Number,
    default: 0,
  },

  currentLatitude: {
    type: Number,
  },

  currentLongitude: {
    type: Number,
  },

  lastLocationUpdate: {
    type: Date,
  },

  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle",
  },

  otpCode: {
    type: String,
  },

  otpExpiresAt: {
    type: Date,
  },
});

driverSchema.pre("save", async function () {
  if (!this.isModified("pinCode")) return;
  const salt = await bcrypt.genSalt(10);
  this.pinCode = await bcrypt.hash(this.pinCode, salt);
});

driverSchema.methods.comparePinCode = async function (candidatePinCode) {
  const isMatch = await bcrypt.compare(candidatePinCode, this.pinCode);
  return isMatch;
};

driverSchema.methods.toJSON = function () {
  let obj = this.toObject();
  delete obj.pinCode;
  return obj;
};

const Driver = mongoose.model("Driver", driverSchema);
module.exports = Driver;
