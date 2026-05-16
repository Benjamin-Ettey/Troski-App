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
        return res.status(StatusCodes.BAD_REQUEST).json({ error: errorMessages });
      }
      next();
    },
  ];
};

const validateIdParam = withValidationErrors([
  param("id").custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error("Invalid ID");
    }
    return true;
  }),
]);

// ============================================================
// USER SIGN-UP & LOGIN
// ============================================================

// Sign-up step 1: name + phone + email + pin.
// Profile photo and date of birth are collected later at /complete-profile.
const validateUserSignUpInput = withValidationErrors([
  body("name").trim().notEmpty().withMessage("name is required"),
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
]);
const validatePassengerSignUpInput = validateUserSignUpInput; // legacy alias

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

// ============================================================
// DRIVER APPLICATION
// ============================================================

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

// ============================================================
// ADMIN
// ============================================================

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

module.exports = {
  validateIdParam,
  validateUserSignUpInput,
  validatePassengerSignUpInput,
  validateLoginInput,
  validateVerifyOtpInput,
  validateCompleteProfileInput,
  validatePinInput,
  validateDriverApplicationInput,
  validateRejectApplicationInput,
  validateAdminInviteInput,
  validateAdminRegisterInput,
};
