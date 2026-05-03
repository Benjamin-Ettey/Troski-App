const createTokenPassenger = (passenger) => {
  return {
    name: passenger.name,
    passengerId: passenger._id,
    phoneNumber: passenger.phoneNumber,
    role: passenger.role,
  };
};

module.exports = createTokenPassenger;
