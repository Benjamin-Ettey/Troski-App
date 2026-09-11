// ============================================================
// DRIVER APPLICATION CONTROLLER
//
// A logged-in user submits an application to become a driver. They upload
// their Ghana card + license images and provide their identity info.
//
// Flow:
//   1. POST /driver-application       — user submits (multipart)
//   2. GET  /driver-application/me    — user checks their status
//   3. GET  /admin/driver-applications           — admin lists pending
//   4. PATCH /admin/driver-applications/:id/approve  — admin approves
//   5. PATCH /admin/driver-applications/:id/reject   — admin rejects
//
// On approval: user.roles gets "driver" added, identity fields are copied
// onto the user document so other systems can read them without joining.
// ============================================================

const { StatusCodes } = require("http-status-codes");
const cloudinary = require("cloudinary");
const DriverApplication = require("../models/driverApplication");
const User = require("../models/passengers"); // unified user collection
const Driver = require("../models/drivers"); // driver profile (links to User)
const { formatImage } = require("../middleware/multerMiddleware");

// ---------- USER-FACING ----------

const submitApplication = async (req, res) => {
  const userId = req.user.passengerId;
  const { licenseID, ghanaCardNumber, city } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
  }

  if (!user.isPhoneVerified || !user.isProfileComplete) {
    return res.status(StatusCodes.FORBIDDEN).json({
      msg: "Finish creating your account before applying to drive.",
    });
  }

  if (user.roles.includes("driver")) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "You are already a driver" });
  }

  // Block duplicate pending/approved applications from the SAME user
  const blocking = await DriverApplication.findOne({
    user: userId,
    status: { $in: ["pending", "approved"] },
  });
  if (blocking) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg:
        blocking.status === "pending"
          ? "You already have an application under review."
          : "You are already an approved driver.",
    });
  }

  // Cross-user uniqueness: nobody ELSE can have an active application
  // OR an approved Driver profile with the same licenseID / Ghana Card.
  // (Partial unique indexes on the schema also enforce this at the DB
  // level — this upfront check just gives a clean error before we upload
  // any images to Cloudinary.)
  const normalizedLicense = String(licenseID || "").trim().toUpperCase();
  const normalizedGhanaCard = String(ghanaCardNumber || "")
    .trim()
    .toUpperCase();

  const Driver = require("../models/drivers");

  const [
    licenseInOtherApp,
    ghanaCardInOtherApp,
    licenseOnOtherDriver,
    ghanaCardOnOtherDriver,
  ] = await Promise.all([
    DriverApplication.findOne({
      user: { $ne: userId },
      licenseID: normalizedLicense,
      status: { $in: ["pending", "approved"] },
    }).select("_id"),
    DriverApplication.findOne({
      user: { $ne: userId },
      ghanaCardNumber: normalizedGhanaCard,
      status: { $in: ["pending", "approved"] },
    }).select("_id"),
    Driver.findOne({
      user: { $ne: userId },
      licenseID: normalizedLicense,
    }).select("_id"),
    Driver.findOne({
      user: { $ne: userId },
      ghanaCardNumber: normalizedGhanaCard,
    }).select("_id"),
  ]);

  if (licenseInOtherApp || licenseOnOtherDriver) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "This license ID is already in use by another driver. If this is an error, please contact support.",
    });
  }
  if (ghanaCardInOtherApp || ghanaCardOnOtherDriver) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "This Ghana Card number is already in use by another driver. If this is an error, please contact support.",
    });
  }

  // Required files. Selfie is what the admin uses to verify the applicant
  // is the same person as on their Ghana Card + license.
  const uploadFields = {
    ghanaCardImage: "Ghana card",
    licenseImage: "license",
    selfieImage: "selfie (real photo of yourself)",
  };
  const missing = Object.keys(uploadFields).filter(
    (f) => !(req.files && req.files[f] && req.files[f][0]),
  );
  if (missing.length) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Please upload photo of ${missing
        .map((f) => uploadFields[f])
        .join(", ")}`,
    });
  }

  const uploadedPublicIds = [];
  const uploadedUrls = {};
  try {
    await Promise.all(
      Object.keys(uploadFields).map(async (field) => {
        const formatted = formatImage(req.files[field][0]);
        const uploaded = await cloudinary.v2.uploader.upload(formatted, {
          use_filename: true,
          folder: `/Troski/Troski-Driver-${field}s`,
        });
        uploadedUrls[field] = uploaded.secure_url;
        uploadedUrls[`${field}PublicId`] = uploaded.public_id;
        uploadedPublicIds.push(uploaded.public_id);
      }),
    );

    const application = await DriverApplication.create({
      user: userId,
      licenseID,
      ghanaCardNumber,
      city,
      ...uploadedUrls,
    });

    res.status(StatusCodes.CREATED).json({
      msg: "Application submitted. You'll be notified once it's reviewed.",
      application,
    });
  } catch (err) {
    // Clean up Cloudinary uploads if DB write failed
    await Promise.all(
      uploadedPublicIds.map((id) =>
        cloudinary.v2.uploader
          .destroy(id)
          .catch((e) => console.error("Cleanup failed", id, e)),
      ),
    );
    console.error(err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Application failed. Please try again." });
  }
};

const getMyApplication = async (req, res) => {
  const application = await DriverApplication.findOne({
    user: req.user.passengerId,
  }).sort({ createdAt: -1 });

  if (!application) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "No application found" });
  }
  res.status(StatusCodes.OK).json({ application });
};

// ---------- ADMIN-FACING ----------

const listApplications = async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const applications = await DriverApplication.find(filter)
    .sort({ createdAt: -1 })
    .populate("user", "name phoneNumber email roles");

  res.status(StatusCodes.OK).json({ count: applications.length, applications });
};

const getApplication = async (req, res) => {
  const application = await DriverApplication.findById(req.params.id)
    .populate("user", "name phoneNumber email roles")
    .populate("reviewedBy", "username");
  if (!application) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "Application not found" });
  }
  res.status(StatusCodes.OK).json({ application });
};

const approveApplication = async (req, res) => {
  const application = await DriverApplication.findById(req.params.id);
  if (!application) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "Application not found" });
  }
  if (application.status !== "pending") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Application is already ${application.status}`,
    });
  }

  const user = await User.findById(application.user);
  if (!user) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "Applicant user not found" });
  }

  // Safety: don't double-create a Driver profile.
  const existingDriver = await Driver.findOne({ user: user._id });
  if (existingDriver) {
    application.status = "approved";
    application.reviewedBy = req.user.adminId;
    application.reviewedAt = new Date();
    await application.save();
    return res.status(StatusCodes.OK).json({
      msg: "User already had a driver profile; application marked approved.",
      application,
      driver: existingDriver,
    });
  }

  // Create the Driver profile, linked to the user.
  const driver = await Driver.create({
    user: user._id,
    licenseID: application.licenseID,
    ghanaCardNumber: application.ghanaCardNumber,
    ghanaCardImage: application.ghanaCardImage,
    ghanaCardImagePublicId: application.ghanaCardImagePublicId,
    licenseImage: application.licenseImage,
    licenseImagePublicId: application.licenseImagePublicId,
    city: application.city,
    application: application._id,
    approvedBy: req.user.adminId,
    approvedAt: new Date(),
  });

  // Grant the driver role AND adopt the verified selfie as the user's
  // profile photo. From this point on, passengers see this person's
  // real face when matched with them as a driver.
  if (!user.roles.includes("driver")) user.roles.push("driver");
  if (application.selfieImage) {
    // Best-effort cleanup of any previous (possibly cartoon/avatar) photo
    if (user.profilePhotoPublicId) {
      const cloudinary = require("cloudinary");
      cloudinary.v2.uploader
        .destroy(user.profilePhotoPublicId)
        .catch((e) =>
          console.error("Failed deleting old user profile photo", e),
        );
    }
    user.profilePhoto = application.selfieImage;
    user.profilePhotoPublicId = application.selfieImagePublicId;
  }
  await user.save();

  application.status = "approved";
  application.reviewedBy = req.user.adminId;
  application.reviewedAt = new Date();
  application.rejectionReason = null;
  await application.save();

  res.status(StatusCodes.OK).json({
    msg: "Application approved. Driver profile created.",
    application,
    driver,
  });
};

const rejectApplication = async (req, res) => {
  const { rejectionReason } = req.body;
  if (!rejectionReason || !rejectionReason.trim()) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Rejection reason is required" });
  }

  const application = await DriverApplication.findById(req.params.id);
  if (!application) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "Application not found" });
  }
  if (application.status !== "pending") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Application is already ${application.status}`,
    });
  }

  application.status = "rejected";
  application.rejectionReason = rejectionReason.trim();
  application.reviewedBy = req.user.adminId;
  application.reviewedAt = new Date();
  await application.save();

  res
    .status(StatusCodes.OK)
    .json({ msg: "Application rejected", application });
};

module.exports = {
  submitApplication,
  getMyApplication,
  listApplications,
  getApplication,
  approveApplication,
  rejectApplication,
};
