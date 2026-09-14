import mongoose from "mongoose";

const VehicleSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverProfile",
      required: true,
    },

    vehicleMake: {
      type: String,
      required: true,
    },

    plateNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    vehicleColor: {
      type: String,
      required: true,
      trim: true,
    },

    vehicleCapacity: {
      type: Number,
      required: true,
    },

    vehicleImage: {
      type: String,
      required: true,
    },

    insuranceCertImage: {
      type: String,
      required: true,
    },

    vehicleRegDocImage: {
      type: String,
      required: true,
    },

    DVLARoadworthyImage: {
      type: String,
      required: true,
    },

    vehicleStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Vehicle", VehicleSchema);
