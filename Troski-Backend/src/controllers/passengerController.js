const { StatusCodes } = require("http-status-codes");
const Passenger = require("../models/passengers");

const getCurrentPassenger = async (req, res) => {
  const passenger = await Passenger.findOne({ _id: req.user.passengerId });

  const passengerWithoutPinCode = passenger.toJSON();

  res.status(StatusCodes.OK).json({ passenger: passengerWithoutPinCode });
};

module.exports = { getCurrentPassenger };
