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

const validatePassengerSignUpInput = withValidationErrors([
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
]);

const validateDriverSignUpInput = withValidationErrors([
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
  body("otpCode")
    .trim()
    .notEmpty()
    .withMessage("OTP code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP code must be 6 digits"),
]);

const validateCreatePinInput = withValidationErrors([
  body("pinCode")
    .trim()
    .notEmpty()
    .withMessage("PIN code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("PIN code must be 6 digits"),
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
  body("routePreferences")
    .trim()
    .isArray({ min: 1 })
    .withMessage("At least one route preference is required"),
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
  body("routePreferences")
    .optional()
    .trim()
    .isArray({ min: 1 })
    .withMessage("At least one route preference is required"),
]);

module.exports = {
  validateIdParam,
  validatePassengerSignUpInput,
  validateLoginInput,
  validateVerifyOtpInput,
  validateCreatePinInput,
  validateDriverSignUpInput,
  validateVehicleRegistrationInput,
  validateUpdateDriverInput,
  validateUpdatePassengerInput,
  validateUpdateVehicleInput,
};
