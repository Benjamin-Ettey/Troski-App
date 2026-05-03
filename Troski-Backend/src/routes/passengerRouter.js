const express = require("express");
const router = express.Router();
const {
  getCurrentPassenger,
} = require("../controllers/passengerController.js");

router.route("/current").get(getCurrentPassenger);

module.exports = router;
