const express = require("express");

const router = express.Router();

const {
  createWallet,
  getMyWallet,
  getWalletBalance,
  initializeWalletTopup,
  verifyWalletTopup,
  withdrawFromWallet,
} = require("../controllers/walletController");

const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authMiddleware");

// Get current user's wallet
router.get("/me", getMyWallet);

router.get("/balance", getWalletBalance);

// Create wallet manually (mainly for testing/fallback)
router.post("/create", createWallet);

// Initialize topup
router.post("/topup/initiate", initializeWalletTopup);

// Verify topup payment
router.get("/topup/verify/:reference", verifyWalletTopup);

// Withdraw from wallet
router.post("/withdraw", withdrawFromWallet);

module.exports = router;
