const Wallet = require("../models/Wallet");

const Transaction = require("../models/Transaction");

const Payment = require("../models/Payment");

const releaseEscrowToDriver = async (ride) => {
  // =========================================
  // GET PAYMENT
  // =========================================

  const payment = await Payment.findOne({
    ride: ride._id,
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  // =========================================
  // PREVENT DOUBLE RELEASE
  // =========================================

  if (payment.escrowReleased) {
    return;
  }

  // =========================================
  // GET WALLETS
  // =========================================

  const passengerWallet = await Wallet.findOne({
    user: ride.passenger,
    userType: "Passenger",
  });

  const driverWallet = await Wallet.findOne({
    user: ride.driver,
    userType: "Driver",
  });

  if (!passengerWallet || !driverWallet) {
    throw new Error("Wallet not found");
  }

  // =========================================
  // REMOVE ESCROW
  // =========================================

  passengerWallet.escrowBalance -= ride.estimatedFare;

  // =========================================
  // CREDIT DRIVER
  // =========================================

  driverWallet.balance += ride.driverPay;

  await passengerWallet.save();

  await driverWallet.save();

  // =========================================
  // CREATE TRANSACTION
  // =========================================

  await Transaction.create({
    ride: ride._id,

    passenger: ride.passenger,

    driver: ride.driver,

    amount: ride.driverPay,

    commission: ride.commissionAmount,

    type: "driver_payout",

    status: "completed",
  });

  // =========================================
  // UPDATE PAYMENT
  // =========================================

  payment.escrowReleased = true;

  payment.status = "completed";

  payment.paidAt = new Date();

  await payment.save();

  // =========================================
  // UPDATE RIDE
  // =========================================

  ride.escrowReleased = true;

  ride.finalPaidFare = ride.estimatedFare;

  await ride.save();
};

module.exports = releaseEscrowToDriver;
