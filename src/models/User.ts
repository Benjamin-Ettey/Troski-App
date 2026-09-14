import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: function (): boolean {
        return this.role !== "admin";
      },
      trim: true,
    },

    pinHash: {
      type: String,
      required: function (): boolean {
        return this.role !== "admin" && this.authProvider === "local";
      },
      select: false,
    },

    adminId: {
      type: String,
      required: function (): boolean {
        return this.role === "admin";
      },
      trim: true,
    },

    password: {
      type: String,
      required: function (): boolean {
        return this.role === "admin";
      },
      select: false,
    },

    role: {
      type: String,
      enum: ["passenger", "driver", "admin"],
      required: true,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    accountStatus: {
      type: String,
      enum: ["active", "suspended", "deactivated"],
      default: "active",
    },

    profileImage: {
      type: String,
      default: null,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
    },

    lastLogin: {
      type: Date,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      sparse: true, // Allows null/undefined but keeps it unique if present
      unique: true,
    },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1, role: 1 }, { unique: true });
UserSchema.index(
  { phoneNumber: 1, role: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phoneNumber: { $exists: true, $type: "string" },
    },
  },
);
UserSchema.index(
  { adminId: 1 },
  {
    unique: true,
    partialFilterExpression: { adminId: { $exists: true, $type: "string" } },
  },
);

UserSchema.pre("save", async function () {
  if (this.isModified("pinHash") && this.pinHash) {
    const salt = await bcrypt.genSalt(10);
    this.pinHash = await bcrypt.hash(this.pinHash, salt);
  }

  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

UserSchema.methods.toJSON = function () {
  let obj = this.toObject();
  delete obj.pinHash;
  delete obj.password;
  return obj;
};

export default mongoose.model("User", UserSchema);
