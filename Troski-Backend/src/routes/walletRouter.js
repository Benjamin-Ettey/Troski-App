const express = require("express");
const router = express.Router();

const {
  getMyWallet,
  getMyWalletTransactions,
  initiateTopup,
  verifyTopup,
  requestWithdrawal,
  listMyWithdrawals,
} = require("../controllers/walletController");

const {
  authenticateUser,
  requireOnboardingComplete,
  requireRole,
} = require("../middleware/authMiddleware");

const userChain = [authenticateUser, requireOnboardingComplete];
const driverChain = [
  authenticateUser,
  requireOnboardingComplete,
  requireRole("driver"),
];

// Balance + statement
router.get("/", ...userChain, getMyWallet);
router.get("/transactions", ...userChain, getMyWalletTransactions);

// Top-up (any user)
router.post("/topup/initiate", ...userChain, initiateTopup);
router.get("/topup/verify/:reference", ...userChain, verifyTopup);

// Withdrawal — drivers only. No admin gate: the request immediately
// fires a Paystack Transfer; the webhook finalizes the WithdrawalRequest.
router.post("/withdraw", ...driverChain, requestWithdrawal);
router.get("/withdrawals", ...driverChain, listMyWithdrawals);

// NOTE: the Paystack webhook is intentionally NOT mounted here.
// It must be wired into server.js with express.raw() BEFORE the global
// express.json() parser; otherwise signature validation fails.

module.exports = router;
