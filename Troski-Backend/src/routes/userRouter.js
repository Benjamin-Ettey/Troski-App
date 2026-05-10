const express = rewuire("express");
const router = express.Router();
const { completeProfile, uploadProfilePicture } = require("../controllers/userController");
const { validatePassengerSignUpInput } = require("../middleware/validationMiddleware");