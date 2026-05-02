const Passenger = require("../models/passengers");
const Driver = require("../models/drivers");
const Admin = require("../models/admins");
const Vehicle = require("../models/vehicles");
const PassengerToken = require("../models/passengerToken");
const DriverToken = require("../models/driverToken");
const AdminToken = require("../models/adminToken");
const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");
const {
  attachPassengerCookiesToResponse,
  attachDriverCookiesToResponse,
  attachAdminCookiesToResponse,
} = require("../utils/tokenUtils");
const { sendOTPEmail } = require("../utils/sendOTPEmail");
const { sendOTPSMS } = require("../utils/sendOTPSMS");
const createHash = require("../utils/createHash");
const createTokenPassenger = require("../utils/createTokenPassenger");
const createTokenDriver = require("../utils/createTokenDriver");
const createTokenAdmin = require("../utils/createTokenAdmin");
const cloudinary = require("cloudinary");
const { formatImage } = require("../middleware/multerMiddleware");

const passengerSignUp = async (req, res) => {
  const { phoneNumber } = req.body;

  const passengerAlreadyExists = await Passenger.findOne({
    phoneNumber,
    role: "passenger",
  });

  if (passengerAlreadyExists) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Passenger already exists" });
  }

  const passenger = await Passenger.create(req.body);

  res.status(StatusCodes.CREATED).json({ msg: "passenger created" });
};

const createPassengerPinCode = async (req, res) => {
  const passengerId = req.user.passengerId;

  const { pinCode } = req.body;

  const passenger = await Passenger.findById(passengerId);

  if (!passenger) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Passenger not found",
    });
  }

  passenger.pinCode = pinCode;

  await passenger.save();

  res.status(StatusCodes.OK).json({ msg: "Pin code created successfully" });
};

const requestPassengerOTP = async (req, res) => {
  const { phoneNumber, method = "sms" } = req.body;

  if (!phoneNumber) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Please provide phone number",
    });
  }

  const passenger = await Passenger.findOne({
    phoneNumber,
    role: "passenger",
  });

  if (!passenger) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Passenger account not found",
    });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  passenger.otpCode = createHash(otpCode);

  passenger.otpExpiresAt = new Date(Date.now() + 1000 * 60 * 5); // OTP expires in 5 minutes

  await passenger.save();

  if (method === "email") {
    await sendOTPEmail({
      email: passenger.email,
      otpCode,
    });
  } else {
    await sendOTPSMS({
      phoneNumber: passenger.phoneNumber,
      otpCode,
    });
  }

  res.status(StatusCodes.OK).json({
    msg:
      method === "email"
        ? "OTP sent to email successfully"
        : "OTP sent to phone number successfully",
  });
};

const verifyPassengerOTP = async (req, res) => {
  const { otpCode } = req.body;

  if (!otpCode) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Invalid OTP",
    });
  }

  const passenger = await Passenger.findOne({
    otpCode: createHash(otpCode),
    role: "passenger",
  });

  if (!passenger) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Passenger not found",
    });
  }

  if (!passenger.otpCode) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "No OTP request found",
    });
  }

  if (passenger.otpExpiresAt && passenger.otpExpiresAt < new Date()) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "OTP has expired",
    });
  }

  const hashedOTP = createHash(otpCode);

  if (hashedOTP !== passenger.otpCode) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      msg: "Invalid OTP",
    });
  }

  passenger.otpCode = null;
  passenger.otpExpiresAt = null;

  await passenger.save();

  const tokenPassenger = createTokenPassenger(passenger);

  let refreshToken = "";

  const existingToken = await PassengerToken.findOne({
    passenger: passenger._id,
  });

  if (existingToken) {
    if (!existingToken.isValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        msg: "Invalid credentials",
      });
    }

    refreshToken = existingToken.refreshToken;

    attachPassengerCookiesToResponse({
      res,
      passenger: tokenPassenger,
      refreshToken,
    });

    return res.status(StatusCodes.OK).json({
      msg: "Login successful",
      passenger: tokenPassenger,
    });
  }

  refreshToken = crypto.randomBytes(40).toString("hex");

  const passengerToken = {
    refreshToken,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    passenger: passenger._id,
  };

  await PassengerToken.create(passengerToken);

  attachPassengerCookiesToResponse({
    res,
    passenger: tokenPassenger,
    refreshToken,
  });

  res.status(StatusCodes.OK).json({
    msg: "Login successful",
    passenger: tokenPassenger,
  });
};

const driverSignUp = async (req, res) => {
  const { phoneNumber } = req.body;

  const driverAlreadyExists = await Driver.findOne({
    phoneNumber,
    role: "driver",
  });

  if (driverAlreadyExists) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Driver already exists",
    });
  }

  const uploadFields = {
    ghanaCardImage: "Ghana card",
    licenseImage: "license",
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

  // Track uploaded images for rollback cleanup
  const uploadedPublicIds = [];

  try {
    // Upload all images concurrently
    await Promise.all(
      Object.keys(uploadFields).map(async (field) => {
        if (req.files && req.files[field]) {
          const file = formatImage(req.files[field][0]);

          const response = await cloudinary.v2.uploader.upload(file, {
            use_filename: true,
            folder: `/Troski/Troski-Driver-${field}s`,
          });

          // Save image URL
          req.body[field] = response.secure_url;

          // Save public ID
          req.body[`${field}PublicId`] = response.public_id;

          // Track uploaded images
          uploadedPublicIds.push(response.public_id);
        }
      }),
    );

    // Create driver
    const driver = await Driver.create(req.body);

    res.status(StatusCodes.CREATED).json({
      msg: "Driver created successfully",
      driver,
    });
  } catch (error) {
    // Rollback cleanup:
    // delete already uploaded images if anything fails
    if (uploadedPublicIds.length > 0) {
      await Promise.all(
        uploadedPublicIds.map(async (publicId) => {
          try {
            await cloudinary.v2.uploader.destroy(publicId);
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
      msg: "Driver signup failed. Please try again.",
    });
  }
};

const createDriverPinCode = async (req, res) => {
  const driverId = req.user.driverId;

  const { pinCode } = req.body;

  const driver = await Driver.findById(driverId);

  if (!driver) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Driver not found",
    });
  }

  driver.pinCode = pinCode;

  await driver.save();

  res.status(StatusCodes.OK).json({ msg: "Pin code created successfully" });
};

const requestDriverOTP = async (req, res) => {
  const { phoneNumber, method = "sms" } = req.body;

  if (!phoneNumber) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Please provide phone number",
    });
  }

  const driver = await Driver.findOne({
    phoneNumber,
    role: "driver",
  });

  if (!driver) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Driver account not found",
    });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  driver.otpCode = createHash(otpCode);

  driver.otpExpiresAt = new Date(Date.now() + 1000 * 60 * 5); // OTP expires in 5 minutes

  await driver.save();

  if (method === "email") {
    await sendOTPEmail({
      email: driver.email,
      otpCode,
    });
  } else {
    await sendOTPSMS({
      phoneNumber: driver.phoneNumber,
      otpCode,
    });
  }

  res.status(StatusCodes.OK).json({
    msg:
      method === "email"
        ? "OTP sent to email successfully"
        : "OTP sent to phone number successfully",
  });
};

const verifyDriverOTP = async (req, res) => {
  const { otpCode } = req.body;

  if (!otpCode) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Invalid OTP",
    });
  }

  const driver = await Driver.findOne({
    otpCode: createHash(otpCode),
    role: "driver",
  });

  if (!driver) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Driver not found",
    });
  }

  if (!driver.otpCode) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "No OTP request found",
    });
  }

  if (driver.otpExpiresAt && driver.otpExpiresAt < new Date()) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "OTP has expired",
    });
  }

  const hashedOTP = createHash(otpCode);

  if (hashedOTP !== driver.otpCode) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      msg: "Invalid OTP",
    });
  }

  driver.otpCode = null;
  driver.otpExpiresAt = null;

  await driver.save();

  const tokenDriver = createTokenDriver(driver);

  let refreshToken = "";

  const existingToken = await DriverToken.findOne({
    driver: driver._id,
  });

  if (existingToken) {
    if (!existingToken.isValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        msg: "Invalid credentials",
      });
    }

    refreshToken = existingToken.refreshToken;

    attachDriverCookiesToResponse({
      res,
      driver: tokenDriver,
      refreshToken,
    });

    return res.status(StatusCodes.OK).json({
      msg: "Login successful",
      driver: tokenDriver,
    });
  }

  refreshToken = crypto.randomBytes(40).toString("hex");

  const driverToken = {
    refreshToken,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    driver: driver._id,
  };

  await DriverToken.create(driverToken);

  attachDriverCookiesToResponse({
    res,
    driver: tokenDriver,
    refreshToken,
  });

  res.status(StatusCodes.OK).json({
    msg: "Login successful",
    driver: tokenDriver,
  });
};

const vehicleRegistration = async (req, res) => {
  const driverId = req.user.driverId;

  let { plateNumber, routePreferences } = req.body;

  const vehicleAlreadyExists = await Vehicle.findOne({
    plateNumber,
  });

  if (vehicleAlreadyExists) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Vehicle already exists",
    });
  }

  if (routePreferences) {
    routePreferences = JSON.parse(routePreferences);
    req.body.routePreferences = routePreferences;
  }

  if (routePreferences.length < 1) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "At least one route preference is required",
    });
  }

  // console.log(routePreferences);

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

  // Track uploaded Cloudinary public IDs
  // for rollback cleanup if something fails
  const uploadedPublicIds = [];

  try {
    // Upload all images concurrently
    await Promise.all(
      Object.keys(uploadFields).map(async (field) => {
        if (req.files && req.files[field]) {
          const file = formatImage(req.files[field][0]);

          const response = await cloudinary.v2.uploader.upload(file, {
            use_filename: true,
            folder: `/Troski/Troski-${field}s`,
          });

          // Save image URL
          req.body[field] = response.secure_url;

          // Save public ID
          req.body[`${field}PublicId`] = response.public_id;

          // Track uploaded images for rollback cleanup
          uploadedPublicIds.push(response.public_id);
        }
      }),
    );

    // Create vehicle record
    const vehicle = await Vehicle.create({
      ...req.body,
      driver: driverId,
    });

    res.status(StatusCodes.CREATED).json({
      msg: "Vehicle registered successfully. Please wait for approval",
      vehicle,
    });
  } catch (error) {
    // Rollback cleanup:
    // delete already uploaded images if later upload fails
    if (uploadedPublicIds.length > 0) {
      await Promise.all(
        uploadedPublicIds.map(async (publicId) => {
          try {
            await cloudinary.v2.uploader.destroy(publicId);
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

  const vehicleAlreadyExists = await Vehicle.findOne({
    plateNumber,
  });

  if (vehicleAlreadyExists) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Vehicle already exists" });
  }
};

const adminSignUp = async (req, res) => {
  const { username } = req.body;

  const adminAlreadyExists = await Admin.findOne({
    username,
    role: "admin",
  });

  if (adminAlreadyExists) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Admin already exists" });
  }

  const admin = await Admin.create(req.body);

  res.status(StatusCodes.CREATED).json({ msg: "admin created" });
};

const passengerLogout = async (req, res) => {
  await PassengerToken.findOneAndDelete({ passenger: req.user.passengerId });

  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

const driverLogout = async (req, res) => {
  await DriverToken.findOneAndDelete({ driver: req.user.driverId });

  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

const adminLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Please provide username and password" });
  }

  const admin = await Admin.findOne({
    username,
    role: "admin",
  });

  if (!admin) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Admin not found",
    });
  }

  const isPasswordCorrect = await admin.comparePassword(password);

  if (!isPasswordCorrect) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Invalid credentials" });
  }

  const tokenAdmin = createTokenAdmin(admin);

  let refreshToken = "";

  const existingToken = await AdminToken.findOne({
    admin: admin._id,
  });

  if (existingToken) {
    if (!existingToken.isValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        msg: "Invalid credentials",
      });
    }

    refreshToken = existingToken.refreshToken;

    attachAdminCookiesToResponse({
      res,
      admin: tokenAdmin,
      refreshToken,
    });

    return res.status(StatusCodes.OK).json({
      msg: "Login successful",
      admin: tokenAdmin,
    });
  }

  refreshToken = crypto.randomBytes(40).toString("hex");

  const adminToken = {
    refreshToken,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    admin: admin._id,
  };

  await AdminToken.create(adminToken);

  attachAdminCookiesToResponse({
    res,
    admin: tokenAdmin,
    refreshToken,
  });

  res.status(StatusCodes.OK).json({
    msg: "Login successful",
    admin: tokenAdmin,
  });
};

const adminLogout = async (req, res) => {
  await AdminToken.findOneAndDelete({ admin: req.user.adminId });

  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(StatusCodes.OK).json({ msg: "admin logged out!" });
};

module.exports = {
  passengerSignUp,
  requestPassengerOTP,
  verifyPassengerOTP,
  driverSignUp,
  requestDriverOTP,
  verifyDriverOTP,
  vehicleRegistration,
  checkPlateNumber,
  adminSignUp,
  adminLogin,
  adminLogout,
  passengerLogout,
  driverLogout,
  createPassengerPinCode,
  createDriverPinCode,
};
