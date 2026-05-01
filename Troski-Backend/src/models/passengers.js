const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const passengerSchema = new mongoose.Schema({
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

  pinCode: {
    type: String,
    default: null,
  },

  role: {
    type: String,
    default: "passenger",
  },

  isPhoneVerified: {
    type: Boolean,
    default: false,
  },

  isProfileComplete: {
    type: Boolean,
    default: false,
  },

  otpCode: {
    type: String,
  },

  otpExpiresAt: {
    type: Date,
  },
});

passengerSchema.pre("save", async function () {
  if (!this.isModified("pinCode")) return;
  const salt = await bcrypt.genSalt(10);
  this.pinCode = await bcrypt.hash(this.pinCode, salt);
});

passengerSchema.methods.comparePinCode = async function (candidatePinCode) {
  const isMatch = await bcrypt.compare(candidatePinCode, this.pinCode);
  return isMatch;
};

passengerSchema.methods.toJSON = function () {
  let obj = this.toObject();
  delete obj.pinCode;
  return obj;
};

const Passenger = mongoose.model("Passenger", passengerSchema);
module.exports = Passenger;
