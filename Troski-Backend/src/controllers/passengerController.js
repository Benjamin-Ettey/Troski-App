const { StatusCodes } = require("http-status-codes");
const Passenger = require("../models/passengers");

const getCurrentPassenger = async (req, res) => {
  const passenger = await Passenger.findById(req.user.passengerId);

  if (!passenger) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Passenger not found" });
  }

  res.status(StatusCodes.OK).json({ passenger: passenger.toJSON() });
};

// Bolt/Uber-style onboarding — called once after first OTP login
const completePassengerProfile = async (req, res) => {
  const passengerId = req.user.passengerId;
  const { name, email, pinCode } = req.body;

  const passenger = await Passenger.findById(passengerId);

  if (!passenger) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Passenger not found" });
  }

  if (name) passenger.name = name;
  if (email) passenger.email = email;
  if (pinCode) passenger.pinCode = pinCode;

  passenger.isProfileComplete = !!(passenger.name && passenger.email);

  await passenger.save();

  res.status(StatusCodes.OK).json({
    msg: "Profile updated successfully",
    passenger: passenger.toJSON(),
    isProfileComplete: passenger.isProfileComplete,
  });
};

module.exports = { getCurrentPassenger, completePassengerProfile };
