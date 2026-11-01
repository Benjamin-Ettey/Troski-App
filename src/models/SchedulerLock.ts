import mongoose from "mongoose";

const SchedulerLockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    holder: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("SchedulerLock", SchedulerLockSchema);
