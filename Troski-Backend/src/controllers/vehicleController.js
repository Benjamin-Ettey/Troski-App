const { StatusCodes } = require("http-status-codes");
const cloudinary = require("cloudinary").v2;

const Vehicle = require("../models/Vehicle");
const { formatImage } = require("../middleware/multerMiddleware");

const vehicleRegistration = async (req, res) => {
  const driverId = req.user.userId;

  let { plateNumber, routePreferences } = req.body;

  const vehicleAlreadyExists = await Vehicle.findOne({
    plateNumber,
  });

  if (vehicleAlreadyExists) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Vehicle already exists",
    });
  }

  // Parse route preferences
  if (routePreferences) {
    try {
      routePreferences = JSON.parse(routePreferences);
      req.body.routePreferences = routePreferences;
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Invalid routePreferences format",
      });
    }
  }

  if (!routePreferences || routePreferences.length < 1) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "At least one route preference is required",
    });
  }

  const uploadFields = {
    vehicleImage: "vehicle",
    insuranceCertImage: "insurance certificate",
    vehicleRegDocImage: "vehicle registration document",
    DVLARoadworthyImage: "DVLA roadworthy document",
  };

  const missingFields = Object.keys(uploadFields).filter((field) => {
    return !(req.files && req.files[field] && req.files[field][0]);
  });

  if (missingFields.length > 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Please upload photo of ${missingFields
        .map((field) => uploadFields[field])
        .join(", ")}`,
    });
  }

  const uploadedPublicIds = [];

  try {
    // Upload images concurrently
    await Promise.all(
      Object.keys(uploadFields).map(async (field) => {
        if (req.files && req.files[field]) {
          const file = formatImage(req.files[field][0]);

          const response = await cloudinary.uploader.upload(file, {
            use_filename: true,
            folder: `/Troski/Troski-${field}s`,
          });

          req.body[field] = response.secure_url;

          req.body[`${field}PublicId`] = response.public_id;

          uploadedPublicIds.push(response.public_id);
        }
      }),
    );

    const vehicle = await Vehicle.create({
      ...req.body,
      driver: driverId,
    });

    res.status(StatusCodes.CREATED).json({
      msg: "Vehicle registered successfully. Please wait for approval",
      vehicle,
    });
  } catch (error) {
    // Rollback uploads
    if (uploadedPublicIds.length > 0) {
      await Promise.all(
        uploadedPublicIds.map(async (publicId) => {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (cleanupError) {
            console.error(
              `Failed to delete Cloudinary image: ${publicId}`,
              cleanupError,
            );
          }
        }),
      );
    }

    console.error(error);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Vehicle registration failed. Please try again.",
    });
  }
};

const checkPlateNumber = async (req, res) => {
  const { plateNumber } = req.body;

  if (!plateNumber) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Please provide plate number",
    });
  }

  const vehicleAlreadyExists = await Vehicle.findOne({
    plateNumber,
  });

  if (vehicleAlreadyExists) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Vehicle already exists",
    });
  }

  res.status(StatusCodes.OK).json({
    msg: "Plate number available",
  });
};

const getCurrentDriverVehicle = async (req, res) => {
  const vehicle = await Vehicle.findOne({
    driver: req.user.userId,
  });

  if (!vehicle) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Vehicle not found",
    });
  }

  res.status(StatusCodes.OK).json({
    vehicle,
  });
};

const getSingleVehicle = async (req, res) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findById(id);

  if (!vehicle) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Vehicle not found",
    });
  }

  res.status(StatusCodes.OK).json({
    vehicle,
  });
};

const updateVehicle = async (req, res) => {
  const { id } = req.params;

  let { routePreferences } = req.body;

  const vehicle = await Vehicle.findById(id);

  if (!vehicle) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Vehicle not found",
    });
  }

  // Driver can only update own vehicle
  if (
    req.user.role === "driver" &&
    vehicle.driver.toString() !== req.user.userId
  ) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      msg: "Unauthorized",
    });
  }

  if (routePreferences) {
    try {
      routePreferences = JSON.parse(routePreferences);
      req.body.routePreferences = routePreferences;
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Invalid routePreferences format",
      });
    }
  }

  const updatedVehicle = await Vehicle.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({
    msg: "Vehicle updated successfully",
    vehicle: updatedVehicle,
  });
};

const deleteVehicle = async (req, res) => {
  const { id } = req.params;

  const vehicle = await Vehicle.findById(id);

  if (!vehicle) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Vehicle not found",
    });
  }

  // Driver can only delete own vehicle
  if (
    req.user.role === "driver" &&
    vehicle.driver.toString() !== req.user.userId
  ) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      msg: "Unauthorized",
    });
  }

  // Delete images from cloudinary
  const publicIds = [
    vehicle.vehicleImagePublicId,
    vehicle.insuranceCertImagePublicId,
    vehicle.vehicleRegDocImagePublicId,
    vehicle.DVLARoadworthyImagePublicId,
  ].filter(Boolean);

  if (publicIds.length > 0) {
    await Promise.all(
      publicIds.map(async (publicId) => {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error(error);
        }
      }),
    );
  }

  await Vehicle.findByIdAndDelete(id);

  res.status(StatusCodes.OK).json({
    msg: "Vehicle deleted successfully",
  });
};

module.exports = {
  vehicleRegistration,
  checkPlateNumber,
  getCurrentDriverVehicle,
  getSingleVehicle,
  updateVehicle,
  deleteVehicle,
};
