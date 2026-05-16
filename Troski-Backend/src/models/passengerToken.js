const mongoose = require("mongoose");

// Refresh token store for end-users (passengers + drivers — same User
// collection, distinguished by user.roles). Named "passengerToken" for
// historical/backward-compat reasons; conceptually it's a UserToken.

const passengerTokenSchema = new mongoose.Schema(
  {
    refreshToken: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    isValid: { type: Boolean, default: true },

    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger", // = User collection
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PassengerToken", passengerTokenSchema);
