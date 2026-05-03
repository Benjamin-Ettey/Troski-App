const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    vehicleType: {
      type: String,
    },

    vehicleColor: {
      type: String,
    },

    plateNumber: {
      type: String,
      unique: true,
    },

    vehicleImage: {
      type: String,
    },

    vehicleImagePublicId: {
      type: String,
    },

    insuranceCertImage: {
      type: String,
    },

    insuranceCertImagePublicId: {
      type: String,
    },

    vehicleRegDocImage: {
      type: String,
    },

    vehicleRegDocImagePublicId: {
      type: String,
    },

    DVLARoadworthyImage: {
      type: String,
    },

    DVLARoadworthyImagePublicId: {
      type: String,
    },

    vehicleCapacity: {
      type: Number,
    },

    routePreferences: [
      {
        from: {
          type: String,
        },
        to: {
          type: String,
        },
      },
    ],

    vehicleStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
module.exports = Vehicle;
