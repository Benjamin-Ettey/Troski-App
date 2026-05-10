const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
  },

  otpCode: {
    type: String,
    required: true,
  },

  expiresAt: {
    type: Date,
    required: true,
  },

  role: {
    type: String,
    enum: ['passenger', 'driver'],
    required: true,
  },
});

const OTPVerification = mongoose.model('OTPVerification', OTPSchema);
module.exports = OTPVerification;