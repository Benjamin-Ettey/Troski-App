const Passenger = require("../models/passengers");
const Driver = require("../models/drivers");
const Admin = require("../models/admins");
const Vehicle = require("../models/vehicles");
const DriverWallet = require("../models/driverWallet");
const PassengerToken = require("../models/passengerToken");
const DriverToken = require("../models/driverToken");
const AdminToken = require("../models/adminToken");
const OtpVerification = require("../models/otpVerification");
const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");
const {
  attachPassengerCookiesToResponse,
  attachDriverCookiesToResponse,
  attachAdminCookiesToResponse,
} = require("../utils/tokenUtils");
const { sendOTPSMS } = require("../utils/sendOTPSMS");
const createHash = require("../utils/createHash");
const createTokenPassenger = require("../utils/createTokenPassenger");
const createTokenDriver = require("../utils/createTokenDriver");
const createTokenAdmin = require("../utils/createTokenAdmin");
const cloudinary = require("cloudinary");
const { formatImage } = require("../middleware/multerMiddleware");

// ─── PASSENGER AUTH ──────────────────────────────────────────────────────────

const requestPassengerOTP = async (req, res) => {
  const { phoneNumber } = req.body;

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  await OtpVerification.deleteMany({ phoneNumber, role: "passenger" });

  await OtpVerification.create({
    phoneNumber,
    role: "passenger",
    otpCode: createHash(otpCode),
    expiresAt: new Date(Date.now() + 1000 * 60 * 5),
  });

  await sendOTPSMS({ phoneNumber, otpCode });

  res.status(StatusCodes.OK).json({ msg: "OTP sent successfully" });
};

const verifyPassengerOTP = async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  const otpRecord = await OtpVerification.findOne({
    phoneNumber,
    role: "passenger",
  });

  if (!otpRecord) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "No OTP request found" });
  }

  if (otpRecord.expiresAt < new Date()) {
    await OtpVerification.deleteOne({ _id: otpRecord._id });
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "OTP has expired" });
  }

  if (createHash(otpCode) !== otpRecord.otpCode) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid OTP" });
  }

  await OtpVerification.deleteOne({ _id: otpRecord._id });

  let passenger = await Passenger.findOne({ phoneNumber });

  const isNewUser = !passenger;

  if (!passenger) {
    passenger = await Passenger.create({
      phoneNumber,
      isPhoneVerified: true,
    });
  } else {
    passenger.isPhoneVerified = true;
    await passenger.save();
  }

  const tokenPassenger = createTokenPassenger(passenger);

  let existingToken = await PassengerToken.findOne({ passenger: passenger._id });

  let refreshToken;

  if (existingToken) {
    if (!existingToken.isValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid credentials" });
    }
    refreshToken = crypto.randomBytes(40).toString("hex");
    existingToken.refreshToken = refreshToken;
    existingToken.ip = req.ip;
    existingToken.userAgent = req.headers["user-agent"];
    await existingToken.save();
  } else {
    refreshToken = crypto.randomBytes(40).toString("hex");
    await PassengerToken.create({
      refreshToken,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      passenger: passenger._id,
    });
  }

  attachPassengerCookiesToResponse({ res, passenger: tokenPassenger, refreshToken });

  res.status(StatusCodes.OK).json({
    msg: "Authentication successful",
    passenger: tokenPassenger,
    isNewUser,
    isProfileComplete: passenger.isProfileComplete,
  });
};

const passengerLogout = async (req, res) => {
  await PassengerToken.findOneAndDelete({ passenger: req.user.passengerId });

  res.cookie("accessToken", "logout", { httpOnly: true, expires: new Date(Date.now()) });
  res.cookie("refreshToken", "logout", { httpOnly: true, expires: new Date(Date.now()) });

  res.status(StatusCodes.OK).json({ msg: "Logged out successfully" });
};

// ─── DRIVER AUTH ─────────────────────────────────────────────────────────────

const requestDriverOTP = async (req, res) => {
  const { phoneNumber } = req.body;

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  await OtpVerification.deleteMany({ phoneNumber, role: "driver" });

  await OtpVerification.create({
    phoneNumber,
    role: "driver",
    otpCode: createHash(otpCode),
    expiresAt: new Date(Date.now() + 1000 * 60 * 5),
  });

  await sendOTPSMS({ phoneNumber, otpCode });

  res.status(StatusCodes.OK).json({ msg: "OTP sent successfully" });
};

const verifyDriverOTP = async (req, res) => {
  const { phoneNumber, otpCode } = req.body;

  const otpRecord = await OtpVerification.findOne({
    phoneNumber,
    role: "driver",
  });

  if (!otpRecord) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "No OTP request found" });
  }

  if (otpRecord.expiresAt < new Date()) {
    await OtpVerification.deleteOne({ _id: otpRecord._id });
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "OTP has expired" });
  }

  if (createHash(otpCode) !== otpRecord.otpCode) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid OTP" });
  }

  await OtpVerification.deleteOne({ _id: otpRecord._id });

  let driver = await Driver.findOne({ phoneNumber });

  const isNewDriver = !driver;

  if (!driver) {
    driver = await Driver.create({ phoneNumber });

    // create wallet for new drivers
    await DriverWallet.create({ driver: driver._id });
  }

  const tokenDriver = createTokenDriver(driver);

  let existingToken = await DriverToken.findOne({ driver: driver._id });

  let refreshToken;

  if (existingToken) {
    if (!existingToken.isValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid credentials" });
    }
    refreshToken = crypto.randomBytes(40).toString("hex");
    existingToken.refreshToken = refreshToken;
    existingToken.ip = req.ip;
    existingToken.userAgent = req.headers["user-agent"];
    await existingToken.save();
  } else {
    refreshToken = crypto.randomBytes(40).toString("hex");
    await DriverToken.create({
      refreshToken,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      driver: driver._id,
    });
  }

  attachDriverCookiesToResponse({ res, driver: tokenDriver, refreshToken });

  res.status(StatusCodes.OK).json({
    msg: "Authentication successful",
    driver: tokenDriver,
    isNewDriver,
    isProfileComplete: !!(driver.name && driver.licenseID && driver.ghanaCardNumber),
  });
};

// Called after OTP verification — driver uploads documents and fills profile details
const completeDriverProfile = async (req, res) => {
  const driverId = req.user.driverId;

  const driver = await Driver.findById(driverId);

  if (!driver) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Driver not found" });
  }

  const uploadFields = {
    ghanaCardImage: "Ghana Card",
    licenseImage: "Driver's License",
  };

  const missingFields = Object.keys(uploadFields).filter((field) => {
    return !(req.files && req.files[field] && req.files[field][0]);
  });

  if (missingFields.length > 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Please upload photo of: ${missingFields.map((f) => uploadFields[f]).join(", ")}`,
    });
  }

  const uploadedPublicIds = [];

  // Delete old images from Cloudinary if re-uploading
  const oldPublicIds = [driver.ghanaCardImagePublicId, driver.licenseImagePublicId].filter(Boolean);

  try {
    // Upload new images concurrently
    await Promise.all(
      Object.keys(uploadFields).map(async (field) => {
        const file = formatImage(req.files[field][0]);

        const response = await cloudinary.v2.uploader.upload(file, {
          use_filename: true,
          folder: `/Troski/Troski-Driver-${field}s`,
        });

        req.body[field] = response.secure_url;
        req.body[`${field}PublicId`] = response.public_id;
        uploadedPublicIds.push(response.public_id);
      })
    );

    const { name, email, city, licenseID, ghanaCardNumber, pinCode } = req.body;

    Object.assign(driver, {
      name,
      email,
      city,
      licenseID,
      ghanaCardNumber,
      ...(pinCode && { pinCode }),
      ghanaCardImage: req.body.ghanaCardImage,
      ghanaCardImagePublicId: req.body.ghanaCardImagePublicId,
      licenseImage: req.body.licenseImage,
      licenseImagePublicId: req.body.licenseImagePublicId,
    });

    await driver.save();

    // Clean up old images after successful save
    if (oldPublicIds.length > 0) {
      await Promise.all(
        oldPublicIds.map((id) => cloudinary.v2.uploader.destroy(id).catch(() => {}))
      );
    }

    res.status(StatusCodes.OK).json({
      msg: "Profile completed successfully. Please register your vehicle.",
      driver: driver.toJSON(),
    });
  } catch (error) {
    if (uploadedPublicIds.length > 0) {
      await Promise.all(
        uploadedPublicIds.map((id) => cloudinary.v2.uploader.destroy(id).catch(() => {}))
      );
    }

    console.error(error);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Profile update failed. Please try again.",
    });
  }
};

const driverLogout = async (req, res) => {
  await DriverToken.findOneAndDelete({ driver: req.user.driverId });

  res.cookie("accessToken", "logout", { httpOnly: true, expires: new Date(Date.now()) });
  res.cookie("refreshToken", "logout", { httpOnly: true, expires: new Date(Date.now()) });

  res.status(StatusCodes.OK).json({ msg: "Logged out successfully" });
};

// ─── VEHICLE ─────────────────────────────────────────────────────────────────

const vehicleRegistration = async (req, res) => {
  const driverId = req.user.driverId;

  // Ensure driver has completed their profile before registering a vehicle
  const driver = await Driver.findById(driverId);

  if (!driver || !driver.name || !driver.licenseID || !driver.ghanaCardNumber) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Please complete your driver profile before registering a vehicle",
    });
  }

  let { plateNumber, routePreferences } = req.body;

  const vehicleAlreadyExists = await Vehicle.findOne({ plateNumber });

  if (vehicleAlreadyExists) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Vehicle with this plate number already exists" });
  }

  if (routePreferences) {
    try {
      routePreferences = JSON.parse(routePreferences);
      req.body.routePreferences = routePreferences;
    } catch {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Invalid route preferences format" });
    }
  }

  if (!routePreferences || routePreferences.length < 1) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "At least one route preference is required",
    });
  }

  const uploadFields = {
    vehicleImage: "vehicle photo",
    insuranceCertImage: "insurance certificate",
    vehicleRegDocImage: "vehicle registration document",
    DVLARoadworthyImage: "DVLA roadworthy document",
  };

  const missingFields = Object.keys(uploadFields).filter((field) => {
    return !(req.files && req.files[field] && req.files[field][0]);
  });

  if (missingFields.length > 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Please upload: ${missingFields.map((f) => uploadFields[f]).join(", ")}`,
    });
  }

  const uploadedPublicIds = [];

  try {
    await Promise.all(
      Object.keys(uploadFields).map(async (field) => {
        const file = formatImage(req.files[field][0]);

        const response = await cloudinary.v2.uploader.upload(file, {
          use_filename: true,
          folder: `/Troski/Troski-${field}s`,
        });

        req.body[field] = response.secure_url;
        req.body[`${field}PublicId`] = response.public_id;
        uploadedPublicIds.push(response.public_id);
      })
    );

    const vehicle = await Vehicle.create({ ...req.body, driver: driverId });

    driver.vehicle = vehicle._id;
    await driver.save();

    res.status(StatusCodes.CREATED).json({
      msg: "Vehicle registered successfully. Pending admin approval.",
      vehicle,
    });
  } catch (error) {
    if (uploadedPublicIds.length > 0) {
      await Promise.all(
        uploadedPublicIds.map((id) => cloudinary.v2.uploader.destroy(id).catch(() => {}))
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

  const vehicleAlreadyExists = await Vehicle.findOne({ plateNumber });

  if (vehicleAlreadyExists) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Vehicle with this plate number already exists" });
  }

  return res.status(StatusCodes.OK).json({ msg: "Plate number is available" });
};

// ─── ADMIN AUTH ───────────────────────────────────────────────────────────────

const adminSignUp = async (req, res) => {
  const { username } = req.body;

  const adminAlreadyExists = await Admin.findOne({ username, role: "admin" });

  if (adminAlreadyExists) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Admin already exists" });
  }

  await Admin.create(req.body);

  res.status(StatusCodes.CREATED).json({ msg: "Admin created successfully" });
};

const adminLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Please provide username and password" });
  }

  const admin = await Admin.findOne({ username, role: "admin" });

  if (!admin) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid credentials" });
  }

  const isPasswordCorrect = await admin.comparePassword(password);

  if (!isPasswordCorrect) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid credentials" });
  }

  const tokenAdmin = createTokenAdmin(admin);

  let existingToken = await AdminToken.findOne({ admin: admin._id });

  let refreshToken;

  if (existingToken) {
    if (!existingToken.isValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid credentials" });
    }
    refreshToken = crypto.randomBytes(40).toString("hex");
    existingToken.refreshToken = refreshToken;
    await existingToken.save();
  } else {
    refreshToken = crypto.randomBytes(40).toString("hex");
    await AdminToken.create({
      refreshToken,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      admin: admin._id,
    });
  }

  attachAdminCookiesToResponse({ res, admin: tokenAdmin, refreshToken });

  res.status(StatusCodes.OK).json({ msg: "Login successful", admin: tokenAdmin });
};

const adminLogout = async (req, res) => {
  await AdminToken.findOneAndDelete({ admin: req.user.adminId });

  res.cookie("accessToken", "logout", { httpOnly: true, expires: new Date(Date.now()) });
  res.cookie("refreshToken", "logout", { httpOnly: true, expires: new Date(Date.now()) });

  res.status(StatusCodes.OK).json({ msg: "Logged out successfully" });
};

module.exports = {
  requestPassengerOTP,
  verifyPassengerOTP,
  passengerLogout,
  requestDriverOTP,
  verifyDriverOTP,
  completeDriverProfile,
  driverLogout,
  vehicleRegistration,
  checkPlateNumber,
  adminSignUp,
  adminLogin,
  adminLogout,
};
