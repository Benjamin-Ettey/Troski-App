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
    .withMessage("phone number is required")
    .isMobilePhone("en-GH")
    .withMessage("invalid phone number"),
  body("role")
    .notEmpty()
    .isIn(["passenger", "driver", "admin"])
    .withMessage("role is required to login"),
]);

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
    .matches(/^[A-Z]{1,3}-\d{1,4}-\d{2}$/)
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
  validateSignUpInput,
  validateRequestOtpInput,
  validateVerifyOtpInput,
  validateVehicleRegistrationInput,
  validateUpdateVehicleInput,
};
