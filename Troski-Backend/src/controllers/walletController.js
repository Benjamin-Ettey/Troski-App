const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const Payment = require("../models/Payment");
const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");
const axios = require("axios");
const {
  generateBalanceHash,
  verifyWalletIntegrity,
} = require("../utils/hashUtils");

const getSharedWallet = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;
  return await Wallet.findOne({ phoneNumber: user.phoneNumber });
};

const createWallet = async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Provide phone number" });

  const existingWallet = await Wallet.findOne({ phoneNumber });
  if (existingWallet)
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Wallet exists" });

  const user = await User.findOne({ phoneNumber });

  // Initial Hash for 0 balance
  const initialHash = generateBalanceHash(0, 0, phoneNumber);

  const wallet = await Wallet.create({
    user: user ? user._id : null,
    phoneNumber,
    balance: 0,
    escrowBalance: 0,
    balanceHash: initialHash,
  });

  const walletWithoutBalances = wallet.toJSON();

  return res
    .status(StatusCodes.CREATED)
    .json({ msg: "Wallet created", wallet: walletWithoutBalances });
};

const getMyWallet = async (req, res) => {
  const wallet = await getSharedWallet(req.user.userId);
  if (!wallet)
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Wallet not found" });

  // Integrity Check
  const expectedHash = generateBalanceHash(
    wallet.balance,
    wallet.escrowBalance,
    wallet.phoneNumber,
  );
  if (wallet.balanceHash !== expectedHash) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "Security Alert: Wallet tampering detected." });
  }

  const walletWithoutBalances = wallet.toJSON();

  return res.status(StatusCodes.OK).json({ wallet: walletWithoutBalances });
};

const initializeWalletTopup = async (req, res) => {
  const { amount, email } = req.body;
  if (!amount || !email)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Amount/Email required" });

  const user = await User.findById(req.user.userId);
  const reference = crypto.randomBytes(12).toString("hex");

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100,
        reference,
        callback_url: "https://yourfrontend.com/payment-success",
      },
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      },
    );

    await Payment.create({
      passenger: user._id,
      phoneNumber: user.phoneNumber,
      amount,
      paystackReference: reference,
      paymentType: "wallet_topup",
      status: "pending",
    });

    return res.status(StatusCodes.OK).json({
      authorization_url: response.data.data.authorization_url,
      reference,
    });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Top-up initialization failed", error: error.message });
  }
};

const verifyWalletTopup = async (req, res) => {
  const { reference } = req.params;
  const payment = await Payment.findOne({ paystackReference: reference });
  if (!payment)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "Payment record not found" });

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      },
    );

    if (response.data.data.status !== "success")
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Failed" });

    const wallet = await Wallet.findOne({ phoneNumber: payment.phoneNumber });
    if (!wallet)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Wallet not found" });

    // 1. Update Balance
    wallet.balance += payment.amount;

    // 2. Update Hash
    wallet.balanceHash = generateBalanceHash(
      wallet.balance,
      wallet.escrowBalance,
      wallet.phoneNumber,
    );
    await wallet.save();

    payment.status = "completed";
    payment.paidAt = new Date();
    await payment.save();

    await Transaction.create({
      user: payment.passenger,
      phoneNumber: payment.phoneNumber,
      amount: payment.amount,
      type: "wallet_topup",
      status: "completed",
    });

    return res.status(StatusCodes.OK).json({ msg: "Wallet Funded" });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Verify failed" });
  }
};

const withdrawFromWallet = async (req, res) => {
  const { amount } = req.body;
  const wallet = await getSharedWallet(req.user.userId);

  if (!wallet)
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Wallet not found" });

  // 1. Integrity Check
  const expectedHash = generateBalanceHash(
    wallet.balance,
    wallet.escrowBalance,
    wallet.phoneNumber,
  );
  if (wallet.balanceHash !== expectedHash)
    return res.status(403).json({ msg: "Tampering detected" });

  if (wallet.balance < amount)
    return res.status(400).json({ msg: "Insufficient" });

  // 2. Update Balance & Hash
  wallet.balance -= amount;
  wallet.balanceHash = generateBalanceHash(
    wallet.balance,
    wallet.escrowBalance,
    wallet.phoneNumber,
  );
  await wallet.save();

  await Transaction.create({
    user: req.user.userId,
    phoneNumber: wallet.phoneNumber,
    amount,
    type: "withdrawal",
    status: "completed",
  });

  return res.status(200).json({ msg: "Withdrawal successful" });
};

const getWalletBalance = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.userId });

    if (!wallet) {
      return res.status(404).json({ msg: "Wallet not found" });
    }

    // 1. Check if the balance in the DB matches the "Seal" (Hash)
    const isValid = verifyWalletIntegrity(wallet);

    if (!isValid) {
      // 2. IF TAMPERED: Do not show the fake balance.
      // Option A: Show 0 and alert support
      // Option B: Re-calculate balance from Transaction history (Most secure)
      console.error(
        `SECURITY ALERT: Wallet ${wallet._id} has been tampered with!`,
      );

      return res.status(StatusCodes.OK).json({
        balance: "Checking...", // Or show the last known valid state if you store it
        isCompromised: true,
        msg: "Financial data syncing. Please contact support if this persists.",
      });
    }

    // 3. IF VALID: Show the real balance
    return res.status(StatusCodes.OK).json({
      balance: wallet.balance,
      escrowBalance: wallet.escrowBalance,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  createWallet,
  getMyWallet,
  getWalletBalance,
  initializeWalletTopup,
  verifyWalletTopup,
  withdrawFromWallet,
};
