import mongoose from "mongoose";

// A Mongo-backed distributed lock so that, across multiple app instances, a
// scheduled job (payouts, demand clustering) runs on only ONE instance per tick.
// The unique `key` is the mutex; `expiresAt` makes it self-healing if a holder
// crashes mid-job.
const SchedulerLockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    holder: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model("SchedulerLock", SchedulerLockSchema);
