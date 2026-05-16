const mongoose = require("mongoose");

const adminInviteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  // Hashed invite token. The raw token is emailed to the invitee and never
  // stored. Lookups are done by hashing the incoming token and matching here.
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  role: {
    type: String,
    enum: ["admin", "super_admin"],
    default: "admin",
  },

  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },

  expiresAt: {
    type: Date,
    required: true,
  },

  used: {
    type: Boolean,
    default: false,
  },

  usedAt: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-delete expired-and-used invites 7 days after expiry to keep the
// collection tidy. We don't auto-delete unused-expired immediately because
// admins may want to audit them.
adminInviteSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 7 },
);

const AdminInvite = mongoose.model("AdminInvite", adminInviteSchema);
module.exports = AdminInvite;
