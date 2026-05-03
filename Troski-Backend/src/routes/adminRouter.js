const express = require("express");
const router = express.Router();
const {
  getCurrentAdmin,
  getAllDrivers,
  getAllPassengers,
  getAllVehicles,
  updatePassenger,
  updateDriver,
  updateVehicle,
  deleteDriver,
  deletePassenger,
  deleteVehicle,
  getSinglePassenger,
  getSingleDriver,
  getSingleVehicle,
  approveVehicleDetails,
  rejectVehicleDetails,
} = require("../controllers/adminController.js");

const {
  validateIdParam,
  validateUpdateDriverInput,
  validateUpdatePassengerInput,
  validateUpdateVehicleInput,
} = require("../middleware/validationMiddleware");

router.route("/current").get(getCurrentAdmin);
router.route("/all-drivers").get(getAllDrivers);
router.route("/all-passengers").get(getAllPassengers);
router.route("/all-vehicles").get(getAllVehicles);
router
  .route("/vehicle/approve/:id")
  .patch(validateIdParam, approveVehicleDetails);
router
  .route("/vehicle/reject/:id")
  .patch(validateIdParam, rejectVehicleDetails);
router
  .route("/driver/:id")
  .get(validateIdParam, getSingleDriver)
  .patch(validateIdParam, validateUpdateDriverInput, updateDriver)
  .delete(validateIdParam, deleteDriver);
router
  .route("/passenger/:id")
  .get(validateIdParam, getSinglePassenger)
  .patch(validateIdParam, validateUpdatePassengerInput, updatePassenger)
  .delete(validateIdParam, deletePassenger);
router
  .route("/vehicle/:id")
  .get(validateIdParam, getSingleVehicle)
  .patch(validateIdParam, validateUpdateVehicleInput, updateVehicle)
  .delete(validateIdParam, deleteVehicle);

module.exports = router;
