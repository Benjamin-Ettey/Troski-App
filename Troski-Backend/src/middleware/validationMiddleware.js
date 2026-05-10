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

// Phone-only — used for both passenger and driver OTP request
const validateLoginInput = withValidationErrors([
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone("en-GH")
    .withMessage("Invalid Ghana phone number"),
]);

// OTP verify requires both phone and code
const validateVerifyOtpInput = withValidationErrors([
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone("en-GH")
    .withMessage("Invalid Ghana phone number"),
  body("otpCode")
    .trim()
    .notEmpty()
    .withMessage("OTP code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP code must be 6 digits"),
]);

// Driver completes profile after OTP verification
const validateDriverCompleteProfileInput = withValidationErrors([
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address"),
  body("city")
    .notEmpty()
    .withMessage("City is required")
    .isIn(Object.values(ghanaCapitalCities))
    .withMessage("Invalid city — must be a Ghana regional capital"),
  body("licenseID")
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("License ID is required")
    .matches(/^[A-Z]{3}-\d{8}-\d{4,5}$/)
    .withMessage("Invalid Ghana license ID format (e.g. DRI-12345678-2024)"),
  body("ghanaCardNumber")
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("Ghana Card number is required")
    .matches(/^GHA-\d{9}-\d$/)
    .withMessage("Invalid Ghana Card format (e.g. GHA-123456789-0)"),
  body("pinCode")
    .optional()
    .trim()
    .isNumeric()
    .withMessage("PIN must contain only numbers")
    .isLength({ min: 6, max: 6 })
    .withMessage("PIN must be 6 digits"),
]);

const validateVehicleRegistrationInput = withValidationErrors([
  body("vehicleType").trim().notEmpty().withMessage("Vehicle type is required"),
  body("plateNumber")
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("Plate number is required")
    .matches(/^[A-Z]{1,3}-\d{1,5}-\d{2}$/)
    .withMessage("Plate number must follow format: GT-1234-24"),
  body("vehicleColor").trim().notEmpty().withMessage("Vehicle color is required"),
  body("vehicleCapacity")
    .notEmpty()
    .withMessage("Vehicle capacity is required")
    .isInt({ min: 4 })
    .withMessage("Vehicle must have at least 4 seats"),
  body("routePreferences.*.from")
    .trim()
    .notEmpty()
    .withMessage("Route 'from' location is required"),
  body("routePreferences.*.to")
    .trim()
    .notEmpty()
    .withMessage("Route 'to' location is required"),
]);

const validateUpdateDriverInput = withValidationErrors([
  body("name").optional().trim().notEmpty().withMessage("Name is required"),
  body("phoneNumber")
    .optional()
    .trim()
    .isMobilePhone("en-GH")
    .withMessage("Invalid Ghana phone number"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email address"),
  body("city")
    .optional()
    .isIn(Object.values(ghanaCapitalCities))
    .withMessage("Invalid city"),
  body("licenseID")
    .optional()
    .trim()
    .toUpperCase()
    .matches(/^[A-Z]{3}-\d{8}-\d{4,5}$/)
    .withMessage("Invalid Ghana license ID format"),
  body("ghanaCardNumber")
    .optional()
    .trim()
    .toUpperCase()
    .matches(/^GHA-\d{9}-\d$/)
    .withMessage("Invalid Ghana Card format"),
  body("pinCode")
    .optional()
    .trim()
    .isNumeric()
    .withMessage("PIN must contain only numbers")
    .isLength({ min: 6, max: 6 })
    .withMessage("PIN must be 6 digits"),
]);

const validateUpdatePassengerInput = withValidationErrors([
  body("name").optional().trim().notEmpty().withMessage("Name is required"),
  body("phoneNumber")
    .optional()
    .trim()
    .isMobilePhone("en-GH")
    .withMessage("Invalid Ghana phone number"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email address"),
  body("pinCode")
    .optional()
    .trim()
    .isNumeric()
    .withMessage("PIN must contain only numbers")
    .isLength({ min: 6, max: 6 })
    .withMessage("PIN must be 6 digits"),
]);

const validateUpdateVehicleInput = withValidationErrors([
  body("vehicleType").optional().trim().notEmpty().withMessage("Vehicle type is required"),
  body("plateNumber")
    .optional()
    .trim()
    .toUpperCase()
    .matches(/^[A-Z]{1,3}-\d{1,4}-\d{2}$/)
    .withMessage("Plate number must follow format: GT-1234-24"),
  body("vehicleColor").optional().trim().notEmpty().withMessage("Vehicle color is required"),
  body("vehicleCapacity")
    .optional()
    .isInt({ min: 4 })
    .withMessage("Vehicle must have at least 4 seats"),
  body("routePreferences.*.from")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Route 'from' location is required"),
  body("routePreferences.*.to")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Route 'to' location is required"),
]);

const validateInitiatePaymentInput = withValidationErrors([
  body("rideId")
    .notEmpty()
    .withMessage("Ride ID is required")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) throw new Error("Invalid ride ID");
      return true;
    }),
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(["mobile_money", "card", "cash"])
    .withMessage("Payment method must be mobile_money, card, or cash"),
  body("mobileMoneyNetwork")
    .if(body("paymentMethod").equals("mobile_money"))
    .notEmpty()
    .withMessage("Mobile money network is required")
    .isIn(["mtn", "vodafone", "tigo"])
    .withMessage("Network must be mtn, vodafone, or tigo"),
  body("mobileMoneyNumber")
    .if(body("paymentMethod").equals("mobile_money"))
    .notEmpty()
    .withMessage("Mobile money number is required")
    .isMobilePhone("en-GH")
    .withMessage("Invalid Ghana phone number for mobile money"),
]);

const validateWithdrawalInput = withValidationErrors([
  body("amount")
    .notEmpty()
    .withMessage("Withdrawal amount is required")
    .isFloat({ min: 1 })
    .withMessage("Minimum withdrawal is GHS 1"),
  body("mobileMoneyNetwork")
    .notEmpty()
    .withMessage("Mobile money network is required")
    .isIn(["mtn", "vodafone", "tigo"])
    .withMessage("Network must be mtn, vodafone, or tigo"),
  body("mobileMoneyNumber")
    .notEmpty()
    .withMessage("Mobile money number is required")
    .isMobilePhone("en-GH")
    .withMessage("Invalid Ghana phone number"),
]);

module.exports = {
  validateIdParam,
  validateLoginInput,
  validateVerifyOtpInput,
  validateDriverCompleteProfileInput,
  validateVehicleRegistrationInput,
  validateUpdateDriverInput,
  validateUpdatePassengerInput,
  validateUpdateVehicleInput,
  validateInitiatePaymentInput,
  validateWithdrawalInput,
};
