const createTokenUser = (user) => {
  return {
    userId: user._id,
    name: user.name,
    username: user.username,
    phoneNumber: user.phoneNumber,
    role: user.role,
  };
};

module.exports = createTokenUser;
