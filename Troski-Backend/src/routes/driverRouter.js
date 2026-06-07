const express = require("express");
const router = express.Router();

const {
  getCurrentDriver,
  getDriverVehicle,
  registerVehicle,
} = require("../controllers/driverController.js");

const { upload } = require("../middleware/multerMiddleware");

router.route("/current").get(getCurrentDriver);
router.route("/vehicle").get(getDriverVehicle);

// Driver registers their vehicle (multipart with 4 document images).
// Vehicle starts in `pending` status; an admin must approve before the
// driver can go online.
router.post(
  "/vehicle",
  upload.fields([
    { name: "vehicleImage", maxCount: 1 },
    { name: "insuranceCertImage", maxCount: 1 },
    { name: "vehicleRegDocImage", maxCount: 1 },
    { name: "DVLARoadworthyImage", maxCount: 1 },
  ]),
  registerVehicle,
);

module.exports = router;
