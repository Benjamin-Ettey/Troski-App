const express = require("express");

const router = express.Router();

const {
  getCurrentAdmin,
  getAllDrivers,
  getAllPassengers,
  getAllVehicles,
  approveVehicleDetails,
  rejectVehicleDetails,
} = require("../controllers/adminController");

const { validateIdParam } = require("../middleware/validationMiddleware");

router.route("/current").get(getCurrentAdmin);

router.route("/drivers").get(getAllDrivers);

router.route("/passengers").get(getAllPassengers);

router.route("/vehicles").get(getAllVehicles);

router
  .route("/vehicle/approve/:id")
  .patch(validateIdParam, approveVehicleDetails);

router
  .route("/vehicle/reject/:id")
  .patch(validateIdParam, rejectVehicleDetails);

module.exports = router;
