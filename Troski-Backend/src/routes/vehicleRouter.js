const express = require("express");
const router = express.Router();

const {
  vehicleRegistration,
  checkPlateNumber,
  getCurrentDriverVehicle,
  getSingleVehicle,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");

const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authMiddleware");

const {
  validateIdParam,
  validateVehicleRegistrationInput,
  validateUpdateVehicleInput,
} = require("../middleware/validationMiddleware");

const { upload } = require("../middleware/multerMiddleware");

router.route("/check-plate-number").post(checkPlateNumber);

router.route("/register").post(
  authenticateUser,
  authorizePermissions("driver"),
  upload.fields([
    { name: "vehicleImage", maxCount: 1 },
    { name: "insuranceCertImage", maxCount: 1 },
    { name: "vehicleRegDocImage", maxCount: 1 },
    { name: "DVLARoadworthyImage", maxCount: 1 },
  ]),
  validateVehicleRegistrationInput,
  vehicleRegistration,
);

router
  .route("/current")
  .get(
    authenticateUser,
    authorizePermissions("driver"),
    getCurrentDriverVehicle,
  );

router
  .route("/:id")
  .get(authenticateUser, validateIdParam, getSingleVehicle)
  .patch(
    authenticateUser,
    validateIdParam,
    validateUpdateVehicleInput,
    updateVehicle,
  )
  .delete(authenticateUser, validateIdParam, deleteVehicle);

module.exports = router;
