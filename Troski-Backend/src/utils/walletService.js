// Wallet money-movement helpers.
//
// Every function:
//   - verifies wallet integrity (HMAC over balance:escrowBalance:phoneNumber)
//   - mutates balance/escrowBalance on the in-memory doc
//   - regenerates and saves the new hash
//   - writes audit records (WalletTransaction + Transaction)
//
// On any integrity failure the function throws WalletError and does NOT
// modify state.
//
// Wallet auto-creation: a user's wallet is lazily created on first touch
// (getOrCreateWallet). Keeps auth flow free of wallet concerns.

const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const WalletTransaction = require("../models/walletTransaction");
const Passenger = require("../models/passengers");
const {
  generateBalanceHash,
  verifyWalletIntegrity,
} = require("./hashUtils");

class WalletError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

async function getOrCreateWallet(userId) {
  let wallet = await Wallet.findOne({ user: userId });
  if (wallet) return wallet;

  const user = await Passenger.findById(userId).select("phoneNumber");
  if (!user) throw new WalletError("User not found", "USER_NOT_FOUND");

  const balanceHash = generateBalanceHash(0, 0, user.phoneNumber);
  wallet = await Wallet.create({
    user: userId,
    phoneNumber: user.phoneNumber,
    balance: 0,
    escrowBalance: 0,
    balanceHash,
  });
  return wallet;
}

// Hold funds in escrow (passenger creating a Booking).
// Throws WalletError("INSUFFICIENT_FUNDS") if balance < amount.
async function holdEscrow({ userId, amount, description, tripId, bookingId }) {
  if (!(amount > 0)) {
    throw new WalletError("Amount must be positive", "BAD_AMOUNT");
  }

  const wallet = await getOrCreateWallet(userId);
  if (!verifyWalletIntegrity(wallet)) {
    throw new WalletError("Wallet integrity check failed", "INTEGRITY_FAIL");
  }
  if (wallet.balance < amount) {
    throw new WalletError("Insufficient wallet balance", "INSUFFICIENT_FUNDS");
  }

  const balanceBefore = wallet.balance;
  wallet.balance -= amount;
  wallet.escrowBalance += amount;
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
    amount,
    description: description || "Escrow hold for trip",
    trip: tripId,
    booking: bookingId,
    balanceBefore,
    balanceAfter: wallet.balance,
  });
  await Transaction.create({
    trip: tripId,
    booking: bookingId,
    passenger: userId,
    amount,
    type: "escrow_hold",
    status: "held",
  });

  return wallet;
}

// Return escrow back to passenger's balance (cancellation).
async function refundEscrow({ userId, amount, description, tripId, bookingId }) {
  if (!(amount > 0)) {
    throw new WalletError("Amount must be positive", "BAD_AMOUNT");
  }
  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet) throw new WalletError("Wallet not found", "NO_WALLET");
  if (!verifyWalletIntegrity(wallet)) {
    throw new WalletError("Wallet integrity check failed", "INTEGRITY_FAIL");
  }
  if (wallet.escrowBalance < amount) {
    throw new WalletError("Escrow shortfall on refund", "ESCROW_SHORTFALL");
  }

  const balanceBefore = wallet.balance;
  wallet.escrowBalance -= amount;
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
    description: description || "Refund (cancellation)",
    trip: tripId,
    booking: bookingId,
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

  return wallet;
}

// Settle one Booking's payout at trip completion.
async function settleBookingPayout({
  passengerUserId,
  driverUserId,
  driverProfileId,
  fareAmount,
  driverPay,
  platformProfit,
  tripId,
  bookingId,
}) {
  const passengerWallet = await Wallet.findOne({ user: passengerUserId });
  if (!passengerWallet) {
    throw new WalletError("Passenger wallet missing", "NO_WALLET");
  }
  if (!verifyWalletIntegrity(passengerWallet)) {
    throw new WalletError(
      "Passenger wallet integrity check failed",
      "INTEGRITY_FAIL",
    );
  }
  if (passengerWallet.escrowBalance < fareAmount) {
    throw new WalletError(
      "Escrow shortfall on settlement",
      "ESCROW_SHORTFALL",
    );
  }
  passengerWallet.escrowBalance -= fareAmount;
  passengerWallet.balanceHash = generateBalanceHash(
    passengerWallet.balance,
    passengerWallet.escrowBalance,
    passengerWallet.phoneNumber,
  );
  await passengerWallet.save();

  const driverWallet = await getOrCreateWallet(driverUserId);
  if (!verifyWalletIntegrity(driverWallet)) {
    throw new WalletError(
      "Driver wallet integrity check failed",
      "INTEGRITY_FAIL",
    );
  }
  const driverBalanceBefore = driverWallet.balance;
  driverWallet.balance += driverPay;
  driverWallet.balanceHash = generateBalanceHash(
    driverWallet.balance,
    driverWallet.escrowBalance,
    driverWallet.phoneNumber,
  );
  await driverWallet.save();

  await WalletTransaction.create({
    wallet: driverWallet._id,
    user: driverUserId,
    type: "credit",
    amount: driverPay,
    description: "Trip payout",
    trip: tripId,
    booking: bookingId,
    balanceBefore: driverBalanceBefore,
    balanceAfter: driverWallet.balance,
  });
  await Transaction.create({
    trip: tripId,
    booking: bookingId,
    passenger: passengerUserId,
    driver: driverProfileId,
    amount: driverPay,
    commission: platformProfit,
    type: "driver_payout",
    status: "completed",
  });

  if (platformProfit > 0) {
    await Transaction.create({
      trip: tripId,
      booking: bookingId,
      passenger: passengerUserId,
      driver: driverProfileId,
      amount: platformProfit,
      type: "platform_fee",
      status: "completed",
    });
  }
}

// Direct credit to a user's wallet balance (no escrow involved).
// Used for refunding paystack-paid bookings back as wallet credit, since
// the original money is already in our Paystack account — we just record
// it as an in-app credit rather than calling Paystack's refund API.
async function creditWallet({ userId, amount, description, tripId, bookingId, reference }) {
  if (!(amount > 0)) {
    throw new WalletError("Amount must be positive", "BAD_AMOUNT");
  }
  const wallet = await getOrCreateWallet(userId);
  if (!verifyWalletIntegrity(wallet)) {
    throw new WalletError("Wallet integrity check failed", "INTEGRITY_FAIL");
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
    description: description || "Wallet credit",
    reference: reference || undefined,
    trip: tripId,
    booking: bookingId,
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
  return wallet;
}

// Split a passenger-cancelled booking's held fare:
//   - Pay driverShare into the driver's wallet
//   - Record platformShare as a platform_fee Transaction
//   - Passenger gets NO refund (this IS the penalty)
//
// For wallet-paid bookings: the passenger's escrowBalance is debited.
// For paystack-paid bookings: the money is already in our Paystack
// account — we just credit the driver and record the platform's cut.
async function settleCancellationPenalty({
  paymentMethod, // "wallet" | "paystack"
  passengerUserId,
  driverUserId,
  driverProfileId,
  totalAmount,
  driverShare,
  platformShare,
  tripId,
  bookingId,
}) {
  if (paymentMethod === "wallet") {
    // Drop the escrow from the passenger's wallet (whole fareAmount leaves
    // their escrowBalance; we're splitting it among driver + platform).
    const passengerWallet = await Wallet.findOne({ user: passengerUserId });
    if (!passengerWallet) {
      throw new WalletError("Passenger wallet missing", "NO_WALLET");
    }
    if (!verifyWalletIntegrity(passengerWallet)) {
      throw new WalletError(
        "Passenger wallet integrity check failed",
        "INTEGRITY_FAIL",
      );
    }
    if (passengerWallet.escrowBalance < totalAmount) {
      throw new WalletError(
        "Escrow shortfall on cancellation penalty",
        "ESCROW_SHORTFALL",
      );
    }
    passengerWallet.escrowBalance -= totalAmount;
    passengerWallet.balanceHash = generateBalanceHash(
      passengerWallet.balance,
      passengerWallet.escrowBalance,
      passengerWallet.phoneNumber,
    );
    await passengerWallet.save();
  }
  // (paystack path: no passenger-side wallet movement — money's already
  // ours, sitting in the Paystack merchant account.)

  // Credit the driver
  const driverWallet = await getOrCreateWallet(driverUserId);
  if (!verifyWalletIntegrity(driverWallet)) {
    throw new WalletError(
      "Driver wallet integrity check failed",
      "INTEGRITY_FAIL",
    );
  }
  const driverBalanceBefore = driverWallet.balance;
  driverWallet.balance += driverShare;
  driverWallet.balanceHash = generateBalanceHash(
    driverWallet.balance,
    driverWallet.escrowBalance,
    driverWallet.phoneNumber,
  );
  await driverWallet.save();

  await WalletTransaction.create({
    wallet: driverWallet._id,
    user: driverUserId,
    type: "credit",
    amount: driverShare,
    description: "Cancellation penalty payout",
    trip: tripId,
    booking: bookingId,
    balanceBefore: driverBalanceBefore,
    balanceAfter: driverWallet.balance,
  });

  await Transaction.create({
    trip: tripId,
    booking: bookingId,
    passenger: passengerUserId,
    driver: driverProfileId,
    amount: driverShare,
    type: "cancellation_fee",
    status: "completed",
  });
  if (platformShare > 0) {
    await Transaction.create({
      trip: tripId,
      booking: bookingId,
      passenger: passengerUserId,
      driver: driverProfileId,
      amount: platformShare,
      type: "platform_fee",
      status: "completed",
    });
  }
}

module.exports = {
  WalletError,
  getOrCreateWallet,
  holdEscrow,
  refundEscrow,
  settleBookingPayout,
  creditWallet,
  settleCancellationPenalty,
};
