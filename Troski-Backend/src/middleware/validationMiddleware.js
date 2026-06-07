const { StatusCodes } = require("http-status-codes");
const mongoose = require("mongoose");
const { body, param, validationResult } = require("express-validator");
const { ghanaCapitalCities } = require("../utils/constants");

const withValidationErrors = (validateValues) => {
  return [
    validateValues,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg);
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: errorMessages });
      }
      next();
    },
  ];
};

const validateIdParam = withValidationErrors([
  param("id").custom((value) => {
    const isValidMongoId = mongoose.Types.ObjectId.isValid(value);
    if (!isValidMongoId) {
      throw new Error("invalid mongodb id");
    }
    return true;
  }),
]);

// Sign-up: name + username + phone + email + pin + gender + dateOfBirth.
// Profile photo is still its own REQUIRED step at /auth/upload-photo.
// Optional extras (emergencyContact) live at /auth/complete-profile.
const validateUserSignUpInput = withValidationErrors([
  body("name").trim().notEmpty().withMessage("name is required"),
  body("username")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("username must be 3-30 characters")
    .matches(/^[a-z0-9._]+$/)
    .withMessage(
      "username can only contain lowercase letters, numbers, dots, and underscores",
    ),
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("phone number is required")
    .isMobilePhone("en-GH")
    .withMessage("invalid phone number"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid email address"),
  body("pinCode")
    .trim()
    .notEmpty()
    .withMessage("PIN code is required")
    .isNumeric()
    .withMessage("PIN Code should contain only numbers")
    .isLength({ min: 6, max: 6 })
    .withMessage("PIN code must be 6 digits"),
  body("gender")
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage("gender is required")
    .isIn(["male", "female", "other"])
    .withMessage("gender must be one of: male, female, other"),
  body("dateOfBirth")
    .notEmpty()
    .withMessage("date of birth is required")
    .isISO8601()
    .withMessage("dateOfBirth must be a valid ISO date")
    .custom((v) => {
      const d = new Date(v);
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      if (d > eighteenYearsAgo) {
        throw new Error("You must be at least 18 years old");
      }
      return true;
    }),
]);

// Legacy alias (router still imports this name)
const validatePassengerSignUpInput = validateUserSignUpInput;

const validateDriverSignUpInput = withValidationErrors([
  // Name is collected at /complete-profile after OTP verification.
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("phone number is required")
    .isMobilePhone("en-GH")
    .withMessage("invalid phone number"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid email address"),
  body("city")
    .notEmpty()
    .withMessage("city is required")
    .isIn(Object.values(ghanaCapitalCities))
    .withMessage("invalid city"),
  body("licenseID")
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("license ID is required")
    .matches(/^[A-Z]{3}-\d{8}-\d{4,5}$/)
    .withMessage("Invalid Ghana license ID format"),
  body("ghanaCardNumber")
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("Ghana card number is required")
    .matches(/^GHA-\d{9}-\d$/)
    .withMessage("Invalid Ghana Card number format"),
  body("pinCode")
    .trim()
    .notEmpty()
    .withMessage("PIN code is required")
    .isNumeric()
    .withMessage("PIN Code should contain only numbers")
    .isLength({ min: 6, max: 6 })
    .withMessage("PIN code must be 6 digits"),
]);

const validateLoginInput = withValidationErrors([
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("phone number is required")
    .isMobilePhone("en-GH")
    .withMessage("invalid phone number"),
]);

const validateVerifyOtpInput = withValidationErrors([
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("phone number is required")
    .isMobilePhone("en-GH")
    .withMessage("invalid phone number"),
  body("otpCode")
    .trim()
    .notEmpty()
    .withMessage("OTP code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP code must be 6 digits"),
]);

// Complete-profile takes JSON body with optional dateOfBirth / gender /
// emergencyContact. All optional; the user can submit any subset.
// (The profile photo has its own dedicated endpoint at /auth/upload-photo
// and is NOT accepted here.)
const validateCompleteProfileInput = withValidationErrors([
  body("dateOfBirth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("dateOfBirth must be a valid ISO date")
    .custom((v) => {
      const d = new Date(v);
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      if (d > eighteenYearsAgo) {
        throw new Error("You must be at least 18 years old");
      }
      return true;
    }),
  body("gender")
    .optional({ checkFalsy: true })
    .isIn(["male", "female", "other", "prefer_not_to_say"])
    .withMessage(
      "gender must be one of: male, female, other, prefer_not_to_say",
    ),
  body("emergencyContact")
    .optional()
    .isObject()
    .withMessage("emergencyContact must be an object")
    .custom((v) => {
      if (!v) return true;
      if (!v.name || typeof v.name !== "string" || !v.name.trim()) {
        throw new Error("emergencyContact.name is required when set");
      }
      if (
        !v.phoneNumber ||
        typeof v.phoneNumber !== "string" ||
        !v.phoneNumber.trim()
      ) {
        throw new Error("emergencyContact.phoneNumber is required when set");
      }
      return true;
    }),
]);

// Driver application — identity fields. Images are validated in the
// controller because they're multipart files.
const validateDriverApplicationInput = withValidationErrors([
  body("licenseID")
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("license ID is required")
    .matches(/^[A-Z]{3}-\d{8}-\d{4,5}$/)
    .withMessage("Invalid Ghana license ID format"),
  body("ghanaCardNumber")
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("Ghana card number is required")
    .matches(/^GHA-\d{9}-\d$/)
    .withMessage("Invalid Ghana Card number format"),
  body("city")
    .trim()
    .notEmpty()
    .withMessage("city is required")
    .isIn(Object.values(ghanaCapitalCities))
    .withMessage("invalid city"),
]);

const validateRejectApplicationInput = withValidationErrors([
  body("rejectionReason")
    .trim()
    .notEmpty()
    .withMessage("rejection reason is required")
    .isLength({ min: 5, max: 500 })
    .withMessage("rejection reason must be 5-500 chars"),
]);

const validatePinInput = withValidationErrors([
  body("pinCode")
    .trim()
    .notEmpty()
    .withMessage("PIN code is required")
    .isNumeric()
    .withMessage("PIN Code should contain only numbers")
    .isLength({ min: 6, max: 6 })
    .withMessage("PIN code must be 6 digits"),
]);

const validateAdminInviteInput = withValidationErrors([
  body("email")
    .trim()
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid email"),
  body("role")
    .optional()
    .isIn(["admin", "super_admin"])
    .withMessage("invalid role"),
]);

const validateAdminRegisterInput = withValidationErrors([
  body("token").trim().notEmpty().withMessage("token is required"),
  body("email").trim().isEmail().withMessage("valid email is required"),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("username is required")
    .isLength({ min: 3, max: 32 })
    .withMessage("username must be 3-32 chars"),
  body("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 8 })
    .withMessage("password must be at least 8 characters"),
]);

const validateVehicleRegistrationInput = withValidationErrors([
  body("vehicleType").trim().notEmpty().withMessage("vehicle type is required"),
  body("plateNumber")
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("plate number is required")
    .matches(/^[A-Z]{1,3}-\d{1,5}-\d{2}$/)
    .withMessage("Plate number must follow format: GT-1234-24"),
  body("vehicleColor")
    .trim()
    .notEmpty()
    .withMessage("vehicle color is required"),
  body("vehicleCapacity")
    .trim()
    .notEmpty()
    .isInt({ min: 4 })
    .withMessage("vehicle capacity must have at least 4 seats")
    .withMessage("vehicle capactiy is required"),
  body("routePreferences").trim(),
  body("routePreferences.*.from")
    .trim()
    .notEmpty()
    .withMessage("From location is required"),
  body("routePreferences.*.to")
    .trim()
    .notEmpty()
    .withMessage("To location is required"),
]);

const validateUpdateDriverInput = withValidationErrors([
  body("name").optional().trim().notEmpty().withMessage("name is required"),
  body("phoneNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("phone number is required")
    .isMobilePhone("en-GH")
    .withMessage("invalid phone number"),
  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid email address"),
  body("city")
    .optional()
    .notEmpty()
    .withMessage("city is required")
    .isIn(Object.values(ghanaCapitalCities))
    .withMessage("invalid city"),
  body("licenseID")
    .optional()
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("license ID is required")
    .matches(/^[A-Z]{3}-\d{8}-\d{4,5}$/)
    .withMessage("Invalid Ghana license ID format"),
  body("ghanaCardNumber")
    .optional()
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("Ghana card number is required")
    .matches(/^GHA-\d{9}-\d$/)
    .withMessage("Invalid Ghana Card number format"),
  body("pinCode")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("PIN code is required")
    .isNumeric()
    .withMessage("PIN Code should contain only numbers")
    .isLength({ min: 6, max: 6 })
    .withMessage("PIN code must be 6 digits"),
]);

const validateUpdatePassengerInput = withValidationErrors([
  body("name").optional().trim().notEmpty().withMessage("name is required"),
  body("phoneNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("phone number is required")
    .isMobilePhone("en-GH")
    .withMessage("invalid phone number"),
  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid email address"),
  body("pinCode")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("PIN code is required")
    .isNumeric()
    .withMessage("PIN Code should contain only numbers")
    .isLength({ min: 6, max: 6 })
    .withMessage("PIN code must be 6 digits"),
]);

const validateUpdateVehicleInput = withValidationErrors([
  body("vehicleType")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("vehicle type is required"),
  body("plateNumber")
    .optional()
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("plate number is required")
    .matches(/^[A-Z]{1,3}-\d{1,5}-\d{2}$/)
    .withMessage("Plate number must follow format: GT-1234-24"),
  body("vehicleColor")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("vehicle color is required"),
  body("vehicleCapacity")
    .optional()
    .trim()
    .notEmpty()
    .isInt({ min: 4 })
    .withMessage("vehicle capacity must have at least 4 seats")
    .withMessage("vehicle capactiy is required"),
  body("routePreferences").optional().trim(),
  body("routePreferences.*.from")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("From location is required"),
  body("routePreferences.*.to")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("To location is required"),
]);

module.exports = {
  validateIdParam,
  validateUserSignUpInput,
  validatePassengerSignUpInput, // legacy alias
  validateLoginInput,
  validateVerifyOtpInput,
  validateCompleteProfileInput,
  validatePinInput,
  validateDriverApplicationInput,
  validateRejectApplicationInput,
  validateAdminInviteInput,
  validateAdminRegisterInput,
  validateDriverSignUpInput,
  validateVehicleRegistrationInput,
  validateUpdateDriverInput,
  validateUpdatePassengerInput,
  validateUpdateVehicleInput,
};
