const createTokenAdmin = (admin) => {
  return {
    adminId: admin._id,
    username: admin.username,
    email: admin.email,
    role: admin.role, // "admin" or "super_admin"
  };
};

module.exports = createTokenAdmin;
