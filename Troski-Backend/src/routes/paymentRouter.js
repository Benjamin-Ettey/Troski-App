const express = require("express");
const router = express.Router();

const {
  initiatePayment,
  checkPaymentStatus,
  getPassengerPaymentHistory,
  handleWebhook,
  getDriverWallet,
  getWalletTransactions,
  requestWithdrawal,
  getWithdrawalHistory,
  processWithdrawal,
  getAllWithdrawals,
  getRidePayment,
  estimateFare,
} = require("../controllers/paymentController");

const {
  authenticatePassenger,
  authenticateDriver,
  authenticateAdmin,
} = require("../middleware/authMiddleware");

const { validateInitiatePaymentInput, validateWithdrawalInput } = require("../middleware/validationMiddleware");

// ─── Public (webhook — no auth, raw body needed for signature check) ──────────
router.route("/webhook").post(handleWebhook);

// ─── Shared — fare estimate (passenger, pre-auth) ─────────────────────────────
router.route("/estimate").post(estimateFare);

// ─── Passenger routes ─────────────────────────────────────────────────────────
router
  .route("/initiate")
  .post(authenticatePassenger, validateInitiatePaymentInput, initiatePayment);

router
  .route("/status/:reference")
  .get(authenticatePassenger, checkPaymentStatus);

router
  .route("/history")
  .get(authenticatePassenger, getPassengerPaymentHistory);

router
  .route("/ride/:rideId")
  .get(authenticatePassenger, getRidePayment);

// ─── Driver routes ────────────────────────────────────────────────────────────
router
  .route("/wallet")
  .get(authenticateDriver, getDriverWallet);

router
  .route("/wallet/transactions")
  .get(authenticateDriver, getWalletTransactions);

router
  .route("/wallet/withdraw")
  .post(authenticateDriver, validateWithdrawalInput, requestWithdrawal)
  .get(authenticateDriver, getWithdrawalHistory);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router
  .route("/admin/withdrawals")
  .get(authenticateAdmin, getAllWithdrawals);

router
  .route("/admin/withdrawals/:id")
  .patch(authenticateAdmin, processWithdrawal);

module.exports = router;
