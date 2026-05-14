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

const validateSignUpInput = withValidationErrors([
  body("role")
    .notEmpty()
    .isIn(["passenger", "driver", "admin"])
    .withMessage("invalid role"),

  body("name")
    .if(body("role").not().equals("admin"))
    .trim()
    .notEmpty()
    .withMessage("name is required"),

  body("phoneNumber")
    .if(body("role").not().equals("admin"))
    .trim()
    .notEmpty()
    .withMessage("phone number is required")
    .isMobilePhone("en-GH")
    .withMessage("invalid phone number"),

  body("email")
    .if(body("role").not().equals("admin"))
    .trim()
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid email"),

  body("city")
    .if(body("role").equals("driver"))
    .notEmpty()
    .withMessage("city is required")
    .isIn(Object.values(ghanaCapitalCities))
    .withMessage("invalid city"),

  body("licenseID")
    .if(body("role").equals("driver"))
    .trim()
    .toUpperCase()
    .notEmpty()
    .withMessage("license ID is required")
    .matches(/^[A-Z]{3}-\d{8}-\d{4,5}$/)
    .withMessage("Invalid Ghana license ID format"),

  body("ghanaCardNumber")
    .if(body("role").equals("driver"))
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

  body("username")
    .if(body("role").equals("admin"))
    .notEmpty()
    .withMessage("username is required"),

  body("password")
    .if(body("role").equals("admin"))
    .notEmpty()
    .withMessage("password is required")
    .isStrongPassword()
    .withMessage(
      "password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol",
    ),
]);

const validateRequestOtpInput = withValidationErrors([
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone("en-GH")
    .withMessage("invalid phone number"),
  body("role")
    .notEmpty()
    .isIn(["passenger", "driver", "admin"])
    .withMessage("role is required to login"),
]);

// OTP verify requires both phone and code
const validateVerifyOtpInput = withValidationErrors([
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("phone number is required")
    .isMobilePhone("en-GH")
    .withMessage("invalid phone number"),
  body("role")
    .notEmpty()
    .isIn(["passenger", "driver", "admin"])
    .withMessage("role is required"),
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
  validateSignUpInput,
  validateRequestOtpInput,
  validateVerifyOtpInput,
  validateVehicleRegistrationInput,
  validateUpdateVehicleInput,
  validateInitiatePaymentInput,
  validateWithdrawalInput,
};
