// One-off bootstrap script to create the very first super_admin.
//
// Usage:
//   node src/scripts/seedSuperAdmin.js <username> <email> <password>
//
// After this runs once, all further admins must be invited via
// POST /api/v1/auth/admin/invite by a logged-in super_admin. There is no
// public endpoint for creating admins.

require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/admins");

async function run() {
  const [, , username, email, password] = process.argv;

  if (!username || !email || !password) {
    console.error(
      "Usage: node src/scripts/seedSuperAdmin.js <username> <email> <password>",
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existingSuper = await Admin.findOne({ role: "super_admin" });
  if (existingSuper) {
    console.error(
      `A super_admin already exists (${existingSuper.username}). Refusing to create another via the seed script. Use /admin/invite from a logged-in super_admin.`,
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const admin = await Admin.create({
    username,
    email: email.toLowerCase().trim(),
    password,
    role: "super_admin",
  });

  console.log(`Super admin created: ${admin.username} <${admin.email}>`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
