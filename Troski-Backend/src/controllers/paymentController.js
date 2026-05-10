const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");
const Ride = require("../models/rides");
const Payment = require("../models/payments");
const DriverWallet = require("../models/driverWallet");
const WalletTransaction = require("../models/walletTransaction");
const WithdrawalRequest = require("../models/withdrawalRequest");
const Passenger = require("../models/passengers");
const Driver = require("../models/drivers");
const {
  initializeTransaction,
  chargeMobileMoney,
  checkCharge,
  verifyTransaction,
  validateWebhookSignature,
} = require("../utils/paystackUtils");
const {
  calculateDistance,
  calculateFare,
  splitFare,
} = require("../utils/fareCalculation");

// ─── PASSENGER: Initiate payment for a completed ride ────────────────────────

const initiatePayment = async (req, res) => {
  const passengerId = req.user.passengerId;
  const { rideId, paymentMethod, mobileMoneyNetwork, mobileMoneyNumber } = req.body;

  const ride = await Ride.findById(rideId);

  if (!ride) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Ride not found" });
  }

  if (String(ride.passenger) !== String(passengerId)) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: "This is not your ride" });
  }

  if (ride.status !== "completed") {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Ride must be completed before payment" });
  }

  if (ride.payment) {
    const existingPayment = await Payment.findById(ride.payment);
    if (existingPayment && existingPayment.status === "completed") {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "This ride has already been paid for" });
    }
  }

  const fare = ride.fare || ride.estimatedFare;
  const { commission, driverEarnings } = splitFare(fare);

  const passenger = await Passenger.findById(passengerId);

  // Handle cash payment — mark immediately as completed
  if (paymentMethod === "cash") {
    const payment = await Payment.create({
      ride: rideId,
      passenger: passengerId,
      driver: ride.driver,
      amount: fare,
      commission,
      driverEarnings,
      paymentMethod: "cash",
      status: "completed",
      paidAt: new Date(),
    });

    ride.payment = payment._id;
    ride.paymentMethod = "cash";
    await ride.save();

    await creditDriverWallet({
      driverId: ride.driver,
      amount: driverEarnings,
      commission,
      rideId: ride._id,
      reference: payment._id.toString(),
    });

    return res.status(StatusCodes.OK).json({
      msg: "Cash payment recorded",
      payment,
    });
  }

  // Generate unique Paystack reference
  const reference = `TROSKI-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

  // Mobile money — trigger direct charge (no redirect)
  if (paymentMethod === "mobile_money") {
    const payment = await Payment.create({
      ride: rideId,
      passenger: passengerId,
      driver: ride.driver,
      amount: fare,
      commission,
      driverEarnings,
      paymentMethod: "mobile_money",
      mobileMoneyNetwork,
      mobileMoneyNumber,
      status: "processing",
      paystackReference: reference,
    });

    ride.payment = payment._id;
    ride.paymentMethod = "mobile_money";
    await ride.save();

    try {
      const chargeData = await chargeMobileMoney({
        email: passenger.email || `${passengerId}@troski.app`,
        amountGHS: fare,
        reference,
        phone: mobileMoneyNumber,
        provider: mobileMoneyNetwork,
      });

      return res.status(StatusCodes.OK).json({
        msg: "Payment initiated. Approve the prompt on your phone.",
        reference,
        displayText: chargeData.display_text,
        status: chargeData.status,
        paymentId: payment._id,
      });
    } catch (error) {
      payment.status = "failed";
      await payment.save();

      return res.status(StatusCodes.BAD_GATEWAY).json({
        msg: "Payment initiation failed. Please try again.",
      });
    }
  }

  // Card payment — return Paystack authorization URL
  if (paymentMethod === "card") {
    const payment = await Payment.create({
      ride: rideId,
      passenger: passengerId,
      driver: ride.driver,
      amount: fare,
      commission,
      driverEarnings,
      paymentMethod: "card",
      status: "processing",
      paystackReference: reference,
    });

    ride.payment = payment._id;
    ride.paymentMethod = "card";
    await ride.save();

    try {
      const { authorizationURL } = await initializeTransaction({
        email: passenger.email || `${passengerId}@troski.app`,
        amountGHS: fare,
        reference,
        channels: ["card"],
      });

      payment.authorizationURL = authorizationURL;
      await payment.save();

      return res.status(StatusCodes.OK).json({
        msg: "Redirect passenger to the authorization URL to complete payment",
        authorizationURL,
        reference,
        paymentId: payment._id,
      });
    } catch (error) {
      payment.status = "failed";
      await payment.save();

      return res.status(StatusCodes.BAD_GATEWAY).json({
        msg: "Payment initiation failed. Please try again.",
      });
    }
  }

  return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Unsupported payment method" });
};

// ─── PASSENGER: Poll mobile money charge status ───────────────────────────────

const checkPaymentStatus = async (req, res) => {
  const passengerId = req.user.passengerId;
  const { reference } = req.params;

  const payment = await Payment.findOne({ paystackReference: reference });

  if (!payment) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Payment not found" });
  }

  if (String(payment.passenger) !== String(passengerId)) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: "Access denied" });
  }

  if (payment.status === "completed") {
    return res.status(StatusCodes.OK).json({ status: "completed", payment });
  }

  try {
    const chargeData = await checkCharge(reference);

    if (chargeData.status === "success") {
      payment.status = "completed";
      payment.paystackTransactionId = chargeData.id?.toString();
      payment.paidAt = new Date();
      await payment.save();

      await creditDriverWallet({
        driverId: payment.driver,
        amount: payment.driverEarnings,
        commission: payment.commission,
        rideId: payment.ride,
        reference,
      });
    }

    return res.status(StatusCodes.OK).json({
      status: chargeData.status,
      payment,
    });
  } catch (error) {
    return res.status(StatusCodes.OK).json({ status: payment.status, payment });
  }
};

// ─── PASSENGER: Payment history ───────────────────────────────────────────────

const getPassengerPaymentHistory = async (req, res) => {
  const passengerId = req.user.passengerId;

  const payments = await Payment.find({ passenger: passengerId })
    .populate("ride", "pickupLocation dropoffLocation status completedAt")
    .sort({ createdAt: -1 });

  res.status(StatusCodes.OK).json({ count: payments.length, payments });
};

// ─── PAYSTACK WEBHOOK ─────────────────────────────────────────────────────────

const handleWebhook = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];

  // Verify webhook authenticity
  if (!validateWebhookSignature(req.rawBody, signature)) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Invalid signature" });
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const { reference } = event.data;

    const payment = await Payment.findOne({ paystackReference: reference });

    if (!payment || payment.status === "completed") {
      return res.sendStatus(200);
    }

    payment.status = "completed";
    payment.paystackTransactionId = event.data.id?.toString();
    payment.paidAt = new Date();
    await payment.save();

    await creditDriverWallet({
      driverId: payment.driver,
      amount: payment.driverEarnings,
      commission: payment.commission,
      rideId: payment.ride,
      reference,
    });
  }

  res.sendStatus(200);
};

// ─── DRIVER: Wallet balance ───────────────────────────────────────────────────

const getDriverWallet = async (req, res) => {
  const driverId = req.user.driverId;

  const wallet = await DriverWallet.findOne({ driver: driverId });

  if (!wallet) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Wallet not found" });
  }

  res.status(StatusCodes.OK).json({ wallet });
};

// ─── DRIVER: Transaction history ─────────────────────────────────────────────

const getWalletTransactions = async (req, res) => {
  const driverId = req.user.driverId;

  const transactions = await WalletTransaction.find({ driver: driverId })
    .populate("ride", "pickupLocation dropoffLocation completedAt")
    .sort({ createdAt: -1 });

  res.status(StatusCodes.OK).json({ count: transactions.length, transactions });
};

// ─── DRIVER: Request withdrawal ───────────────────────────────────────────────

const requestWithdrawal = async (req, res) => {
  const driverId = req.user.driverId;
  const { amount, mobileMoneyNetwork, mobileMoneyNumber } = req.body;

  const wallet = await DriverWallet.findOne({ driver: driverId });

  if (!wallet) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Wallet not found" });
  }

  if (amount > wallet.availableBalance) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Insufficient balance. Available: GHS ${wallet.availableBalance.toFixed(2)}`,
    });
  }

  // Reserve the amount while request is pending
  wallet.availableBalance -= amount;
  await wallet.save();

  const withdrawalRequest = await WithdrawalRequest.create({
    driver: driverId,
    wallet: wallet._id,
    amount,
    mobileMoneyNetwork,
    mobileMoneyNumber,
  });

  await WalletTransaction.create({
    wallet: wallet._id,
    driver: driverId,
    type: "debit",
    amount,
    description: `Withdrawal request to ${mobileMoneyNetwork.toUpperCase()} ${mobileMoneyNumber}`,
    reference: withdrawalRequest._id.toString(),
    balanceBefore: wallet.availableBalance + amount,
    balanceAfter: wallet.availableBalance,
  });

  res.status(StatusCodes.CREATED).json({
    msg: "Withdrawal request submitted. Processing within 24 hours.",
    withdrawalRequest,
  });
};

// ─── DRIVER: Withdrawal history ───────────────────────────────────────────────

const getWithdrawalHistory = async (req, res) => {
  const driverId = req.user.driverId;

  const withdrawals = await WithdrawalRequest.find({ driver: driverId }).sort({ createdAt: -1 });

  res.status(StatusCodes.OK).json({ count: withdrawals.length, withdrawals });
};

// ─── ADMIN: Process withdrawal ────────────────────────────────────────────────

const processWithdrawal = async (req, res) => {
  const { id } = req.params;
  const { action, rejectionReason } = req.body;

  if (!["approve", "reject"].includes(action)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Action must be 'approve' or 'reject'" });
  }

  const withdrawal = await WithdrawalRequest.findById(id);

  if (!withdrawal) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Withdrawal request not found" });
  }

  if (withdrawal.status !== "pending") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `Withdrawal has already been ${withdrawal.status}`,
    });
  }

  const wallet = await DriverWallet.findById(withdrawal.wallet);

  if (action === "reject") {
    // Refund the reserved amount
    wallet.availableBalance += withdrawal.amount;
    await wallet.save();

    withdrawal.status = "rejected";
    withdrawal.rejectionReason = rejectionReason || "Rejected by admin";
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    await WalletTransaction.create({
      wallet: wallet._id,
      driver: withdrawal.driver,
      type: "credit",
      amount: withdrawal.amount,
      description: "Withdrawal request rejected — funds returned",
      reference: withdrawal._id.toString(),
      balanceBefore: wallet.availableBalance - withdrawal.amount,
      balanceAfter: wallet.availableBalance,
    });

    return res.status(StatusCodes.OK).json({
      msg: "Withdrawal rejected and funds returned to driver",
      withdrawal,
    });
  }

  // approve — mark as completed (actual disbursement is manual or via Paystack Transfer API)
  withdrawal.status = "completed";
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  wallet.totalWithdrawn += withdrawal.amount;
  await wallet.save();

  return res.status(StatusCodes.OK).json({
    msg: "Withdrawal approved and marked as completed",
    withdrawal,
  });
};

// ─── ADMIN: All pending withdrawals ──────────────────────────────────────────

const getAllWithdrawals = async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};

  const withdrawals = await WithdrawalRequest.find(filter)
    .populate("driver", "name phoneNumber")
    .sort({ createdAt: -1 });

  res.status(StatusCodes.OK).json({ count: withdrawals.length, withdrawals });
};

// ─── SHARED: Get payment for a specific ride ──────────────────────────────────

const getRidePayment = async (req, res) => {
  const { rideId } = req.params;

  const payment = await Payment.findOne({ ride: rideId });

  if (!payment) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Payment not found for this ride" });
  }

  res.status(StatusCodes.OK).json({ payment });
};

// ─── SHARED: Estimate fare before requesting a ride ───────────────────────────

const estimateFare = async (req, res) => {
  const { pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude } = req.body;

  if (!pickupLatitude || !pickupLongitude || !dropoffLatitude || !dropoffLongitude) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "All coordinates are required" });
  }

  const distance = calculateDistance(
    parseFloat(pickupLatitude),
    parseFloat(pickupLongitude),
    parseFloat(dropoffLatitude),
    parseFloat(dropoffLongitude)
  );

  const fare = calculateFare(distance);

  res.status(StatusCodes.OK).json({
    distance,
    estimatedFare: fare,
    currency: "GHS",
  });
};

// ─── INTERNAL: Credit driver wallet after successful payment ──────────────────

const creditDriverWallet = async ({ driverId, amount, commission, rideId, reference }) => {
  if (!driverId) return;

  const wallet = await DriverWallet.findOne({ driver: driverId });

  if (!wallet) return;

  const balanceBefore = wallet.availableBalance;

  wallet.availableBalance += amount;
  wallet.totalEarned += amount;
  wallet.totalCommissionPaid += commission;
  await wallet.save();

  await WalletTransaction.create({
    wallet: wallet._id,
    driver: driverId,
    type: "credit",
    amount,
    description: "Ride earnings",
    reference,
    ride: rideId,
    balanceBefore,
    balanceAfter: wallet.availableBalance,
  });

  // Update driver total earnings
  await Driver.findByIdAndUpdate(driverId, { $inc: { totalEarnings: amount } });
};

module.exports = {
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
};
