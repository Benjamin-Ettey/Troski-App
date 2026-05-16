const mongoose = require("mongoose");

const adminTokenSchema = new mongoose.Schema(
  {
    refreshToken: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    isValid: { type: Boolean, default: true },

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminToken", adminTokenSchema);
