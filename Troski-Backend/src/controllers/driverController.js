const { StatusCodes } = require("http-status-codes");
const cloudinary = require("cloudinary");

const Driver = require("../models/drivers");
const Vehicle = require("../models/vehicles");
const { formatImage } = require("../middleware/multerMiddleware");

// All driver endpoints look up the Driver profile by the logged-in user's
// _id (passengerId in the token payload). Token never holds the Driver._id
// directly — drivers and passengers share one auth flow.

const getCurrentDriver = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId }).populate(
    "user",
    "name phoneNumber email profilePhoto roles",
  );

  if (!driver) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "No driver profile for this user" });
  }

  res.status(StatusCodes.OK).json({ driver });
};

const getDriverVehicle = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId });
  if (!driver) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "No driver profile for this user" });
  }

  const vehicle = await Vehicle.findOne({ driver: driver._id });
  if (!vehicle) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "Vehicle not found for this driver" });
  }

  res.status(StatusCodes.OK).json({ vehicle });
};

// POST /api/v1/driver/vehicle  (multipart)
// Body fields: plateNumber, vehicleType, vehicleColor, vehicleCapacity,
//              routePreferences (JSON string of [{from, to}, ...])
// Files: vehicleImage, insuranceCertImage, vehicleRegDocImage, DVLARoadworthyImage
//
// Creates a Vehicle in `pending` status and links it to the driver profile.
// Admin must approve before the driver can go online (driverLocationController.goOnline
// refuses if vehicle.vehicleStatus !== 'approved').
//
// If the driver already has a vehicle:
//   - Pending or approved → refuse with 400 (use update endpoint instead — TODO)
//   - Rejected → allow resubmission (replace the old vehicle)
const registerVehicle = async (req, res) => {
  const userId = req.user.passengerId;
  const driver = await Driver.findOne({ user: userId });
  if (!driver) {
    return res.status(StatusCodes.FORBIDDEN).json({
      msg: "No driver profile. Your driver application must be approved first.",
    });
  }

  // Check current vehicle state
  if (driver.vehicle) {
    const existing = await Vehicle.findById(driver.vehicle);
    if (existing && existing.vehicleStatus !== "rejected") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: `You already have a registered vehicle (status: ${existing.vehicleStatus}).`,
        vehicle: existing,
      });
    }
    // Rejected — allow resubmission; old vehicle will be replaced below.
  }

  let {
    plateNumber,
    vehicleType,
    vehicleColor,
    vehicleCapacity,
    routePreferences,
  } = req.body;

  // ── Basic required-field checks ──
  if (!plateNumber || !vehicleType || !vehicleColor || !vehicleCapacity) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "plateNumber, vehicleType, vehicleColor, and vehicleCapacity are required",
    });
  }
  plateNumber = String(plateNumber).trim().toUpperCase();
  if (!/^[A-Z]{1,3}-\d{1,5}-\d{2}$/.test(plateNumber)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Plate number must follow format like GT-1234-24",
    });
  }
  vehicleCapacity = parseInt(vehicleCapacity, 10);
  if (!Number.isFinite(vehicleCapacity) || vehicleCapacity < 4) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Vehicle capacity must be a number ≥ 4",
    });
  }

  // ── Parse routePreferences (multipart sends it as a JSON string) ──
  if (typeof routePreferences === "string") {
    try {
      routePreferences = JSON.parse(routePreferences);
    } catch {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "routePreferences must be a JSON array like [{\"from\":\"Madina\",\"to\":\"Tema\"}]",
      });
    }
  }
  if (
    !Array.isArray(routePreferences) ||
    routePreferences.length === 0 ||
    routePreferences.some(
      (r) =>
        !r || typeof r.from !== "string" || typeof r.to !== "string" ||
        !r.from.trim() || !r.to.trim(),
    )
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "At least one valid route preference is required (each with a non-empty 'from' and 'to')",
    });
  }

  // ── Plate uniqueness ──
  const plateTaken = await Vehicle.findOne({
    plateNumber,
    _id: { $ne: driver.vehicle || null },
  });
  if (plateTaken) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "A vehicle with this plate number is already registered",
    });
  }

  // ── Required file uploads ──
  const uploadFields = {
    vehicleImage: "vehicle photo",
    insuranceCertImage: "insurance certificate",
    vehicleRegDocImage: "vehicle registration document",
    DVLARoadworthyImage: "DVLA roadworthy certificate",
  };
  const missing = Object.keys(uploadFields).filter(
    (f) => !(req.files && req.files[f] && req.files[f][0]),
  );
  if (missing.length) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Please upload photo of: ${missing
        .map((f) => uploadFields[f])
        .join(", ")}`,
    });
  }

  // ── Upload to Cloudinary, then create the Vehicle.
  // If anything below fails, clean up the Cloudinary uploads so we don't
  // leave orphaned files.
  const uploadedPublicIds = [];
  const uploadedUrls = {};
  try {
    await Promise.all(
      Object.keys(uploadFields).map(async (field) => {
        const file = formatImage(req.files[field][0]);
        const uploaded = await cloudinary.v2.uploader.upload(file, {
          use_filename: true,
          folder: `/Troski/Troski-Vehicle-${field}s`,
        });
        uploadedUrls[field] = uploaded.secure_url;
        uploadedUrls[`${field}PublicId`] = uploaded.public_id;
        uploadedPublicIds.push(uploaded.public_id);
      }),
    );

    // If we're replacing a rejected vehicle, clean up its old images.
    if (driver.vehicle) {
      const oldVehicle = await Vehicle.findById(driver.vehicle);
      if (oldVehicle && oldVehicle.vehicleStatus === "rejected") {
        const oldIds = [
          oldVehicle.vehicleImagePublicId,
          oldVehicle.insuranceCertImagePublicId,
          oldVehicle.vehicleRegDocImagePublicId,
          oldVehicle.DVLARoadworthyImagePublicId,
        ].filter(Boolean);
        await Promise.all(
          oldIds.map((id) =>
            cloudinary.v2.uploader
              .destroy(id)
              .catch((e) =>
                console.error("Failed to delete old vehicle image", id, e),
              ),
          ),
        );
        await Vehicle.deleteOne({ _id: oldVehicle._id });
      }
    }

    const vehicle = await Vehicle.create({
      driver: driver._id,
      plateNumber,
      vehicleType,
      vehicleColor,
      vehicleCapacity,
      routePreferences,
      ...uploadedUrls,
      vehicleStatus: "pending",
    });

    driver.vehicle = vehicle._id;
    await driver.save();

    res.status(StatusCodes.CREATED).json({
      msg: "Vehicle registered. Awaiting admin approval.",
      vehicle,
    });
  } catch (err) {
    // Rollback Cloudinary uploads if the DB write failed
    await Promise.all(
      uploadedPublicIds.map((id) =>
        cloudinary.v2.uploader
          .destroy(id)
          .catch((e) => console.error("Cleanup failed", id, e)),
      ),
    );
    console.error("registerVehicle failed", err);
    if (err && err.code === 11000) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "A vehicle with this plate number is already registered",
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Vehicle registration failed. Please try again.",
    });
  }
};

module.exports = { getCurrentDriver, getDriverVehicle, registerVehicle };
