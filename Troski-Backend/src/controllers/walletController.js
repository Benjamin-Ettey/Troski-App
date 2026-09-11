// Wallet controller: top-up initiation, Paystack webhook, balance reads.
//
// Architecture:
//   1. Passenger taps "Add money" → /wallet/topup/initiate { amount }
//      We create a pending Payment + call paystackUtils.initializeTransaction.
//      Frontend redirects them to the authorizationURL (or opens it in-app).
//   2. Passenger authorizes on Paystack-hosted page (or in the MoMo prompt).
//   3. Paystack POSTs the result to /wallet/paystack/webhook.
//      We verify the HMAC-SHA512 signature against the RAW body, then on
//      charge.success we credit the user's wallet — idempotently, so
//      receiving the same event twice (Paystack retries on 5xx) is safe.
//
// IMPORTANT: the webhook route must be mounted with express.raw() BEFORE
// the global express.json() in server.js, or signature validation fails.

const crypto = require("crypto");
const { StatusCodes } = require("http-status-codes");

const Wallet = require("../models/Wallet");
const Payment = require("../models/payments");
const Booking = require("../models/bookings");
const Trip = require("../models/trips");
const WalletTransaction = require("../models/walletTransaction");
const Transaction = require("../models/Transaction");
const Passenger = require("../models/passengers");
const { emit } = require("../socket/emit");

const {
  initializeTransaction,
  validateWebhookSignature,
  createTransferRecipient,
  initiateTransfer,
} = require("../utils/paystackUtils");
const {
  generateBalanceHash,
  verifyWalletIntegrity,
} = require("../utils/hashUtils");
const { getOrCreateWallet } = require("../utils/walletService");
const WithdrawalRequest = require("../models/withdrawalRequest");
const Driver = require("../models/drivers");

const MIN_TOPUP_GHS = 1;
const MAX_TOPUP_GHS = 1000; // single-transaction ceiling; tunable

// ─────────────────────────────────────────────────────────────────────
// GET /api/v1/wallet
// Integrity-verified balance. Strips no fields here because the caller
// is the user themselves.
// ─────────────────────────────────────────────────────────────────────
const getMyWallet = async (req, res) => {
  const userId = req.user.passengerId;
  const wallet = await getOrCreateWallet(userId);
  if (!verifyWalletIntegrity(wallet)) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Wallet integrity check failed — please contact support.",
    });
  }
  res.status(StatusCodes.OK).json({
    balance: wallet.balance,
    escrowBalance: wallet.escrowBalance,
    currency: "GHS",
    phoneNumber: wallet.phoneNumber,
  });
};

// ─────────────────────────────────────────────────────────────────────
// GET /api/v1/wallet/transactions
// Paginated per-wallet statement (latest first).
// Query: ?limit=25&before=<isoDate>
// ─────────────────────────────────────────────────────────────────────
const getMyWalletTransactions = async (req, res) => {
  const userId = req.user.passengerId;
  const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
  const filter = { user: userId };
  if (req.query.before) {
    const d = new Date(req.query.before);
    if (!isNaN(d.getTime())) filter.createdAt = { $lt: d };
  }
  const rows = await WalletTransaction.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit);
  res.status(StatusCodes.OK).json({ count: rows.length, transactions: rows });
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/v1/wallet/topup/initiate
// Body: { amount }      (GHS)
// Returns: { authorizationURL, reference, amount }
// ─────────────────────────────────────────────────────────────────────
const initiateTopup = async (req, res) => {
  const userId = req.user.passengerId;
  const amount = parseFloat(req.body?.amount);

  if (!Number.isFinite(amount) || amount < MIN_TOPUP_GHS) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Minimum top-up is GHS ${MIN_TOPUP_GHS}`,
    });
  }
  if (amount > MAX_TOPUP_GHS) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Maximum single top-up is GHS ${MAX_TOPUP_GHS}`,
    });
  }

  const user = await Passenger.findById(userId).select("email phoneNumber");
  if (!user || !user.email) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Email required for Paystack top-up" });
  }

  // Make sure the wallet exists so the webhook has somewhere to credit.
  await getOrCreateWallet(userId);

  // Unique reference per attempt. Prefix lets webhook tell topups apart
  // from ride payments at a glance.
  const reference = `TOPUP_${userId}_${crypto.randomBytes(8).toString("hex")}`;

  // Persist a Payment row in `pending` state BEFORE calling Paystack so
  // even if the network blip swallows our response, the webhook can find
  // and resolve this attempt.
  const payment = await Payment.create({
    passenger: userId,
    paymentType: "wallet_topup",
    phoneNumber: user.phoneNumber,
    amount,
    currency: "GHS",
    paymentProvider: "paystack",
    paystackReference: reference,
    status: "pending",
  });

  let init;
  try {
    init = await initializeTransaction({
      email: user.email,
      amountGHS: amount,
      reference,
    });
  } catch (err) {
    console.error("Paystack initializeTransaction failed", err.message);
    payment.status = "failed";
    await payment.save();
    return res.status(StatusCodes.BAD_GATEWAY).json({
      msg: "Could not start top-up. Please try again.",
    });
  }

  res.status(StatusCodes.OK).json({
    msg: "Top-up initiated. Complete the payment to credit your wallet.",
    authorizationURL: init.authorizationURL,
    reference: init.reference,
    amount,
    paymentId: payment._id,
  });
};

// ─────────────────────────────────────────────────────────────────────
// POST /api/v1/wallet/paystack/webhook
// Receives Paystack's signed events. Idempotent: re-processing the same
// event credits the wallet at most once.
//
// IMPORTANT: this route is mounted with express.raw() in server.js so
// req.body is a Buffer when signature validation runs. We then JSON.parse
// the buffer ourselves.
// ─────────────────────────────────────────────────────────────────────
const handlePaystackWebhook = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const rawBody = req.body; // Buffer (because of express.raw)

  if (!signature || !rawBody) {
    return res.status(StatusCodes.BAD_REQUEST).send("missing signature/body");
  }

  const rawString = Buffer.isBuffer(rawBody) ? rawBody.toString() : String(rawBody);
  if (!validateWebhookSignature(rawString, signature)) {
    return res.status(StatusCodes.UNAUTHORIZED).send("invalid signature");
  }

  let event;
  try {
    event = JSON.parse(rawString);
  } catch {
    return res.status(StatusCodes.BAD_REQUEST).send("invalid json");
  }

  // We respond 200 quickly to acknowledge receipt — Paystack retries on
  // non-2xx, which could double-process. The handler itself is
  // idempotent, so retries are safe, but we still want to ack fast.
  try {
    switch (event.event) {
      case "charge.success":
        await onChargeSuccess(event.data);
        break;
      case "charge.failed":
        await onChargeFailed(event.data);
        break;
      case "transfer.success":
        await onTransferSuccess(event.data);
        break;
      case "transfer.failed":
      case "transfer.reversed":
        await onTransferFailed(event.data);
        break;
      // Other events ignored for now.
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    // Still 200 so Paystack doesn't retry forever on a bug on our side;
    // operator should investigate via logs.
  }

  res.status(StatusCodes.OK).send("ok");
};

// ── Webhook helpers ─────────────────────────────────────────────────

async function onChargeSuccess(data) {
  const reference = data?.reference;
  if (!reference) return;

  const payment = await Payment.findOne({ paystackReference: reference });
  if (!payment) {
    console.warn(`Webhook charge.success: no Payment for ${reference}`);
    return;
  }

  // Idempotency guard — if we've already processed this, do nothing.
  if (payment.status === "completed" || payment.status === "held") return;

  if (payment.paymentType === "wallet_topup") {
    await creditWalletForTopup(payment);
  } else if (payment.paymentType === "ride_payment") {
    await confirmRidePayment(payment);
  }
}

async function onChargeFailed(data) {
  const reference = data?.reference;
  if (!reference) return;
  const payment = await Payment.findOne({ paystackReference: reference });
  if (!payment || payment.status === "completed") return;
  payment.status = "failed";
  await payment.save();

  // If this was a ride payment, the booking should also be cancelled so
  // it doesn't sit forever in `awaiting_payment`.
  if (payment.paymentType === "ride_payment" && payment.booking) {
    const booking = await Booking.findById(payment.booking);
    if (booking && booking.status === "awaiting_payment") {
      booking.status = "cancelled";
      booking.cancelledAt = new Date();
      booking.cancellationReason = "payment failed";
      await booking.save();
      emit.toUser(booking.passenger, "booking:payment_failed", {
        bookingId: booking._id,
        reason: "Mobile money charge was declined.",
      });
    }
  }
}

// ── Transfer events (driver withdrawals) ────────────────────────────

async function onTransferSuccess(data) {
  const reference = data?.reference;
  if (!reference) return;

  const request = await WithdrawalRequest.findOne({ payoutReference: reference });
  if (!request || request.status === "completed") return;

  request.status = "completed";
  request.processedAt = new Date();
  await request.save();

  // Mark the corresponding Transaction completed
  await Transaction.findOneAndUpdate(
    {
      driver: request.driver,
      amount: request.amount,
      type: "withdrawal",
      status: "pending",
    },
    { $set: { status: "completed" } },
  );

  emit.toUser(request.user, "withdrawal:completed", {
    requestId: request._id,
    amount: request.amount,
  });
}

async function onTransferFailed(data) {
  const reference = data?.reference;
  if (!reference) return;

  const request = await WithdrawalRequest.findOne({ payoutReference: reference });
  if (!request || ["completed", "rejected"].includes(request.status)) return;

  // Refund the driver's wallet — the transfer didn't go through.
  const wallet = await Wallet.findById(request.wallet);
  if (wallet && verifyWalletIntegrity(wallet)) {
    const balanceBefore = wallet.balance;
    wallet.balance += request.amount;
    wallet.balanceHash = generateBalanceHash(
      wallet.balance,
      wallet.escrowBalance,
      wallet.phoneNumber,
    );
    await wallet.save();
    await WalletTransaction.create({
      wallet: wallet._id,
      user: request.user,
      type: "credit",
      amount: request.amount,
      description: `Withdrawal failed at Paystack — refunded`,
      balanceBefore,
      balanceAfter: wallet.balance,
    });
  } else {
    console.error(
      `onTransferFailed: wallet missing or integrity-failed for ${request._id}`,
    );
  }

  request.status = "rejected";
  request.rejectionReason = data?.reason || "Paystack transfer failed";
  request.processedAt = new Date();
  await request.save();

  await Transaction.findOneAndUpdate(
    {
      driver: request.driver,
      amount: request.amount,
      type: "withdrawal",
      status: "pending",
    },
    { $set: { status: "refunded" } },
  );

  emit.toUser(request.user, "withdrawal:failed", {
    requestId: request._id,
    amount: request.amount,
    reason: request.rejectionReason,
  });
}

// Ride payment confirmed by Paystack. Money is now in our merchant account
// ("held" at the Payment level). Flip the Booking from awaiting_payment to
// pending, push to the driver, and notify the passenger.
//
// Edge case: passenger may have cancelled the booking before authorizing
// the charge. If so, the money is in our Paystack account but the booking
// is dead. Refund it as in-app wallet credit (cheap, instant — Paystack
// refund API call would add latency + fees).
async function confirmRidePayment(payment) {
  const booking = await Booking.findById(payment.booking);
  if (!booking) {
    console.warn(`confirmRidePayment: booking ${payment.booking} missing`);
    payment.status = "completed";
    await payment.save();
    return;
  }

  // Cancelled / rejected before authorization → wallet credit refund.
  if (
    booking.status !== "awaiting_payment" &&
    booking.status !== "pending"
  ) {
    await creditWalletAsRefund(
      booking.passenger,
      payment.amount,
      `Refund — booking ${booking._id} was ${booking.status} before payment confirmed`,
      payment.paystackReference,
      booking.trip,
      booking._id,
    );
    payment.status = "refunded";
    payment.paidAt = new Date();
    await payment.save();
    return;
  }

  // Happy path: flip the booking to pending and notify the driver.
  booking.status = "pending";
  booking.paymentStatus = "held";
  await booking.save();

  payment.status = "held";
  payment.paidAt = new Date();
  await payment.save();

  // Record the "money has arrived" event in the system ledger.
  await Transaction.create({
    trip: booking.trip,
    booking: booking._id,
    passenger: booking.passenger,
    amount: payment.amount,
    type: "escrow_hold",
    status: "held",
  });

  // Tell the passenger their booking is live.
  emit.toUser(booking.passenger, "booking:payment_confirmed", {
    bookingId: booking._id,
  });

  // Tell the driver they have a new request (same payload shape as the
  // wallet-path version).
  const trip = await Trip.findById(booking.trip).select("driver");
  if (trip?.driver) {
    const passengerUser = await Passenger.findById(booking.passenger).select(
      "name profilePhoto",
    );
    emit.toDriver(trip.driver, "booking:new", {
      bookingId: booking._id,
      tripId: booking.trip,
      requestedPickup: booking.requestedPickup,
      dropoff: booking.dropoffLocation,
      fareAmount: booking.fareAmount,
      passenger: {
        _id: booking.passenger,
        name: passengerUser?.name || null,
        photo: passengerUser?.profilePhoto || null,
      },
    });
  }
}

// Credit a passenger's wallet balance directly (used for paystack-refunds
// to avoid the latency + fees of a Paystack refund API call).
async function creditWalletAsRefund(
  userId,
  amount,
  description,
  reference,
  tripId,
  bookingId,
) {
  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    console.error("Refund failed — wallet missing for", userId);
    return;
  }
  if (!verifyWalletIntegrity(wallet)) {
    console.error("Refund failed — wallet integrity check failed for", userId);
    return;
  }
  const balanceBefore = wallet.balance;
  wallet.balance += amount;
  wallet.balanceHash = generateBalanceHash(
    wallet.balance,
    wallet.escrowBalance,
    wallet.phoneNumber,
  );
  await wallet.save();
  await WalletTransaction.create({
    wallet: wallet._id,
    user: userId,
    type: "credit",
    amount,
    description: description || "Refund",
    reference,
    trip: tripId || undefined,
    booking: bookingId || undefined,
    balanceBefore,
    balanceAfter: wallet.balance,
  });
  await Transaction.create({
    trip: tripId,
    booking: bookingId,
    passenger: userId,
    amount,
    type: "refund",
    status: "completed",
  });
}

// Credit the user's wallet for a successful wallet_topup payment.
// All wallet writes verify + regenerate the integrity hash.
async function creditWalletForTopup(payment) {
  const wallet = await Wallet.findOne({ user: payment.passenger });
  if (!wallet) {
    console.error(
      `Top-up ${payment.paystackReference}: wallet missing for user ${payment.passenger}`,
    );
    return;
  }
  if (!verifyWalletIntegrity(wallet)) {
    console.error(
      `Top-up ${payment.paystackReference}: wallet integrity check FAILED before credit`,
    );
    return;
  }

  const balanceBefore = wallet.balance;
  wallet.balance += payment.amount;
  wallet.balanceHash = generateBalanceHash(
    wallet.balance,
    wallet.escrowBalance,
    wallet.phoneNumber,
  );
  await wallet.save();

  await WalletTransaction.create({
    wallet: wallet._id,
    user: payment.passenger,
    type: "credit",
    amount: payment.amount,
    description: "Wallet top-up via Paystack",
    reference: payment.paystackReference,
    balanceBefore,
    balanceAfter: wallet.balance,
  });

  await Transaction.create({
    passenger: payment.passenger,
    amount: payment.amount,
    type: "wallet_topup",
    status: "completed",
  });

  payment.status = "completed";
  payment.escrowReleased = false;
  payment.paidAt = new Date();
  await payment.save();
}

// ─────────────────────────────────────────────────────────────────────
// GET /api/v1/wallet/topup/verify/:reference   (optional polling fallback)
// Lets the frontend ask "did this top-up land yet?" if the user closes
// the app before the webhook arrives. Idempotent — uses the same Payment
// row.
// ─────────────────────────────────────────────────────────────────────
const verifyTopup = async (req, res) => {
  const { reference } = req.params;
  const payment = await Payment.findOne({
    paystackReference: reference,
    passenger: req.user.passengerId,
  });
  if (!payment) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Top-up not found" });
  }
  res.status(StatusCodes.OK).json({
    status: payment.status,
    amount: payment.amount,
    reference: payment.paystackReference,
  });
};

// ─────────────────────────────────────────────────────────────────────
// WITHDRAWAL FLOW (driver-only, no admin gate)
//
// Driver hits /wallet/withdraw → we debit their wallet immediately,
// create a WithdrawalRequest, and fire the Paystack Transfer right away.
// Paystack returns "pending" or "otp" synchronously, then later fires a
// transfer.success / transfer.failed webhook which we use to finalize
// the WithdrawalRequest.
//
// If anything goes wrong BEFORE Paystack accepts the transfer (e.g. bad
// recipient), we refund the wallet right then. If the webhook reports
// failure later, we refund there.
//
// Admin can VIEW withdrawals for fraud monitoring (separate route) but
// doesn't have to approve anything to release the money.
// ─────────────────────────────────────────────────────────────────────

const MIN_WITHDRAWAL_GHS = 5;

const requestWithdrawal = async (req, res) => {
  const userId = req.user.passengerId;
  const { amount, mobileMoneyNumber, mobileMoneyNetwork } = req.body || {};

  // ── Input validation ──
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt < MIN_WITHDRAWAL_GHS) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Minimum withdrawal is GHS ${MIN_WITHDRAWAL_GHS}`,
    });
  }
  if (!mobileMoneyNumber || typeof mobileMoneyNumber !== "string") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "mobileMoneyNumber required" });
  }
  if (!["mtn", "vodafone", "tigo"].includes(mobileMoneyNetwork)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "mobileMoneyNetwork must be mtn / vodafone / tigo" });
  }

  // ── Driver + wallet checks ──
  const driver = await Driver.findOne({ user: userId }).populate(
    "user",
    "name",
  );
  if (!driver) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "Driver profile required" });
  }

  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "No wallet" });
  }
  if (!verifyWalletIntegrity(wallet)) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Wallet integrity check failed — please contact support.",
    });
  }
  if (wallet.balance < amt) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Insufficient withdrawable balance",
      available: wallet.balance,
    });
  }

  // ── Debit wallet immediately to prevent double-spend during the
  //    Paystack call ──
  const balanceBefore = wallet.balance;
  wallet.balance -= amt;
  wallet.balanceHash = generateBalanceHash(
    wallet.balance,
    wallet.escrowBalance,
    wallet.phoneNumber,
  );
  await wallet.save();

  await WalletTransaction.create({
    wallet: wallet._id,
    user: userId,
    type: "debit",
    amount: amt,
    description: `Withdrawal to ${mobileMoneyNetwork.toUpperCase()} ${mobileMoneyNumber}`,
    balanceBefore,
    balanceAfter: wallet.balance,
  });

  const reference = `WD_${driver._id}_${crypto.randomBytes(6).toString("hex")}`;

  await Transaction.create({
    passenger: userId,
    driver: driver._id,
    amount: amt,
    type: "withdrawal",
    status: "pending",
  });

  const request = await WithdrawalRequest.create({
    driver: driver._id,
    user: userId,
    wallet: wallet._id,
    amount: amt,
    mobileMoneyNetwork,
    mobileMoneyNumber,
    status: "processing",
    payoutReference: reference,
  });

  // ── Fire the Paystack Transfer ──
  try {
    // Reuse cached recipient if same number+network, else create a fresh one.
    let recipientCode = driver.paystackRecipientCode;
    if (
      !recipientCode ||
      driver.paystackRecipientNumber !== mobileMoneyNumber ||
      driver.paystackRecipientNetwork !== mobileMoneyNetwork
    ) {
      recipientCode = await createTransferRecipient({
        name: driver.user?.name || `Driver ${driver._id}`,
        accountNumber: mobileMoneyNumber,
        network: mobileMoneyNetwork,
      });
      driver.paystackRecipientCode = recipientCode;
      driver.paystackRecipientNumber = mobileMoneyNumber;
      driver.paystackRecipientNetwork = mobileMoneyNetwork;
      await driver.save();
    }

    await initiateTransfer({
      amountGHS: amt,
      recipientCode,
      reference,
      reason: `Troski driver withdrawal #${request._id}`,
    });

    // Transfer initiated; final status arrives via webhook
    // (transfer.success or transfer.failed).
    return res.status(StatusCodes.CREATED).json({
      msg: "Withdrawal initiated. You'll receive a MoMo confirmation shortly.",
      request,
      walletBalance: wallet.balance,
    });
  } catch (err) {
    // Paystack rejected the request synchronously — refund the wallet
    // immediately so the driver isn't out of pocket.
    console.error("requestWithdrawal Paystack call failed", err.message);
    wallet.balance += amt;
    wallet.balanceHash = generateBalanceHash(
      wallet.balance,
      wallet.escrowBalance,
      wallet.phoneNumber,
    );
    await wallet.save();
    await WalletTransaction.create({
      wallet: wallet._id,
      user: userId,
      type: "credit",
      amount: amt,
      description: `Withdrawal failed — refunded (${err.message})`,
      balanceBefore: wallet.balance - amt,
      balanceAfter: wallet.balance,
    });

    request.status = "rejected";
    request.rejectionReason = `Paystack rejected: ${err.message}`;
    await request.save();

    return res.status(StatusCodes.BAD_GATEWAY).json({
      msg: "Could not process withdrawal. Funds returned to your wallet.",
      error: err.message,
    });
  }
};

const listMyWithdrawals = async (req, res) => {
  const userId = req.user.passengerId;
  const requests = await WithdrawalRequest.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50);
  res.status(StatusCodes.OK).json({ count: requests.length, requests });
};

// Admin-side: read-only view of all withdrawals for fraud monitoring.
// Admin doesn't need to approve — they just watch.
const adminListWithdrawals = async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const requests = await WithdrawalRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate("user", "name phoneNumber email")
    .populate("driver", "licenseID city");
  res.status(StatusCodes.OK).json({ count: requests.length, requests });
};

module.exports = {
  getMyWallet,
  getMyWalletTransactions,
  initiateTopup,
  verifyTopup,
  handlePaystackWebhook,
  requestWithdrawal,
  listMyWithdrawals,
  adminListWithdrawals,
};
