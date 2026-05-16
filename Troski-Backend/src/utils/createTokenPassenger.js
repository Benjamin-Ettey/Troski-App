// Token payload for end-users (passengers + drivers; both live in the same
// Passenger/User collection now, distinguished by roles).
const createTokenPassenger = (user) => {
  return {
    name: user.name,
    passengerId: user._id, // legacy key name; this is the user's _id
    phoneNumber: user.phoneNumber,
    roles: user.roles || ["passenger"],
  };
};

module.exports = createTokenPassenger;
