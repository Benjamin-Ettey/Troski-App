const express = require("express");

const router = express.Router();

const {
  getCurrentUser,
  getMyVehicle,
} = require("../controllers/userController");

const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authMiddleware");

router.route("/current").get(authenticateUser, getCurrentUser);

router
  .route("/vehicle")
  .get(authenticateUser, authorizePermissions("driver"), getMyVehicle);

module.exports = router;
