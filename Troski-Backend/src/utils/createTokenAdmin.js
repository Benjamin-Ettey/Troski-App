const createTokenAdmin = (admin) => {
  return {
    username: admin.username,
    adminId: admin._id,
    role: admin.role,
  };
};

module.exports = createTokenAdmin;
