const mongoose = require("mongoose");

const adminTokenSchema = new mongoose.Schema(
  {
    refreshToken: { type: String, required: true },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    isValid: { type: Boolean, default: true },
    admin: {
      type: mongoose.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminToken", adminTokenSchema);
