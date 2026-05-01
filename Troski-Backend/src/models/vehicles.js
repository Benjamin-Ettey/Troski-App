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
      required: true,
    },

    vehicleColor: {
      type: String,
      required: true,
    },

    plateNumber: {
      type: String,
      required: true,
      unique: true,
    },

    vehicleImage: {
      type: String,
      // required: true,
    },

    vehicleImagePublicId: {
      type: String,
      // required: true,
    },

    insuranceCertImage: {
      type: String,
      // required: true,
    },

    insuranceCertImagePublicId: {
      type: String,
    },

    vehicleRegDocImage: {
      type: String,
      // required: true,
    },

    vehicleRegDocImagePublicId: {
      type: String,
    },

    DVLARoadworthyImage: {
      type: String,
      // required: true,
    },

    DVLARoadworthyImagePublicId: {
      type: String,
    },

    vehicleCapacity: {
      type: Number,
      required: true,
    },

    routePreferences: [
      {
        from: {
          type: String,
          required: true,
        },
        to: {
          type: String,
          required: true,
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
