const User = require("../models/User");
const Ride = require("../models/Ride");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const Payment = require("../models/Payment");
const DriverLocation = require("../models/DriverLocation");

const calculateDistance = require("../utils/calculateDistance");
const calculateRouteFare = require("../utils/calculateRouteFare");
const isWithinRadius = require("../utils/isWithinRadius");
const findNearbyDrivers = require("../utils/findNearbyDrivers");
const releaseEscrowToDriver = require("../utils/releaseEscrowToDriver");
const findNearestTown = require("../utils/findNearestTown");

const zonesConfig = require("../data/zonesConfig");
const { StatusCodes } = require("http-status-codes");
const mongoose = require("mongoose");
const { generateBalanceHash } = require("../utils/hashUtils");
const driverSocketMap = require("../utils/socketStore");

const getWalletByUserId = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;
  return await Wallet.findOne({ phoneNumber: user.phoneNumber });
};

const estimateRideFare = async (req, res) => {
  try {
    const {
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
    } = req.body;

    if (
      !pickupLatitude ||
      !pickupLongitude ||
      !dropoffLatitude ||
      !dropoffLongitude
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Please provide all coordinates" });
    }

    const pickupTown = findNearestTown({
      latitude: pickupLatitude,
      longitude: pickupLongitude,
    });
    const dropoffTown = findNearestTown({
      latitude: dropoffLatitude,
      longitude: dropoffLongitude,
    });

    const distanceInKm = calculateDistance(
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
    );

    const fareDetails = calculateRouteFare({
      pickupZone: pickupTown.zoneID,
      dropoffZone: dropoffTown.zoneID,
      distanceInKm,
      zonesConfig,
    });

    return res.status(StatusCodes.OK).json({
      pickupTown: pickupTown.town,
      dropoffTown: dropoffTown.town,
      distanceInKm,
      ...fareDetails,
    });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Failed to estimate fare" });
  }
};

const processEscrowHold = async (userId, amount) => {
  const wallet = await getWalletByUserId(userId);
  if (!wallet) throw new Error("Wallet not found");

  // 1. Integrity Check
  const currentHash = generateBalanceHash(
    wallet.balance,
    wallet.escrowBalance,
    wallet.phoneNumber,
  );
  if (wallet.balanceHash !== currentHash)
    throw new Error("Security Alert: Wallet tampering detected.");

  // 2. Balance Check
  if (wallet.balance < amount) throw new Error("Insufficient wallet balance");

  // 3. Move Funds
  wallet.balance -= amount;
  wallet.escrowBalance += amount;

  // 4. Update Hash
  wallet.balanceHash = generateBalanceHash(
    wallet.balance,
    wallet.escrowBalance,
    wallet.phoneNumber,
  );
  await wallet.save();

  // 5. Create Transaction Record
  const transaction = await Transaction.create({
    user: userId,
    phoneNumber: wallet.phoneNumber,
    amount: amount,
    type: "escrow_hold",
    status: "held",
  });

  return { wallet, transaction };
};

const requestRide = async (req, res) => {
  let fundsMoved = false;
  let heldAmount = 0;
  let passengerId = req.user.userId;

  try {
    const {
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
      pickupLocation,
      dropoffLocation,
    } = req.body;

    // 1. Geography & Fare Calculations
    const pickupTown = findNearestTown({
      latitude: pickupLatitude,
      longitude: pickupLongitude,
    });
    const dropoffTown = findNearestTown({
      latitude: dropoffLatitude,
      longitude: dropoffLongitude,
    });
    const distanceInKm = calculateDistance(
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
    );

    const { basePrice, finalFare, driverPay, troskiProfit, breakdown } =
      calculateRouteFare({
        pickupZone: pickupTown.zoneID,
        dropoffZone: dropoffTown.zoneID,
        distanceInKm,
        zonesConfig,
      });

    heldAmount = finalFare;

    // 2. TRIGGER ESCROW (Move funds before creating ride)
    const { wallet } = await processEscrowHold(passengerId, heldAmount);
    fundsMoved = true;

    // 3. Create Ride Record
    const nearbyDrivers = await findNearbyDrivers(
      pickupLatitude,
      pickupLongitude,
    );

    const ride = await Ride.create({
      passenger: passengerId,
      pickupLocation,
      dropoffLocation,
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
      distanceInKm,
      pickupZone: pickupTown.zoneID,
      dropoffZone: dropoffTown.zoneID,
      baseFare: basePrice,
      calculatedFare: finalFare - breakdown.platformFee,
      platformFee: breakdown.platformFee,
      commissionAmount: breakdown.commission,
      troskiProfit,
      driverPay,
      estimatedFare: finalFare,
      paymentHeld: true,
      nearbyDriversNotified: nearbyDrivers.map((d) => d.driver || d._id),
    });

    // 4. Create Payment Record
    await Payment.create({
      ride: ride._id,
      passenger: passengerId,
      phoneNumber: wallet.phoneNumber,
      amount: finalFare,
      paymentType: "ride_payment",
      status: "held",
    });

    // 5. Notify Drivers
    const io = req.app.get("io");

    nearbyDrivers.forEach((driver) => {
      io.to(driver.socketId).emit("newRideRequest", {
        ride,
      });
    });

    return res.status(StatusCodes.CREATED).json({
      msg: "Ride requested and payment held",
      ride,
    });
  } catch (error) {
    console.error("Ride Request Error:", error.message);

    // --- MANUAL ROLLBACK ---
    // If the error happened AFTER we moved money to escrow, move it back.
    if (fundsMoved) {
      try {
        const wallet = await getWalletByUserId(passengerId);
        wallet.balance += heldAmount;
        wallet.escrowBalance -= heldAmount;
        wallet.balanceHash = generateBalanceHash(
          wallet.balance,
          wallet.escrowBalance,
          wallet.phoneNumber,
        );
        await wallet.save();
        console.log("Rollback: Funds returned to user balance.");
      } catch (rollbackError) {
        console.error("CRITICAL: Rollback failed!", rollbackError.message);
      }
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: error.message || "Failed to request ride",
    });
  }
};

const acceptRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const driverId = req.user.userId;

    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== "requested") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Ride unavailable" });
    }

    ride.driver = driverId;
    ride.status = "accepted";
    ride.driverAcceptedAt = new Date();
    await ride.save();

    req.app.get("io").emit("rideAccepted", ride);
    return res.status(StatusCodes.OK).json({ msg: "Ride accepted", ride });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Acceptance failed" });
  }
};

const startRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride)
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Ride not found" });

    ride.status = "in_progress";
    ride.rideStartedAt = new Date();
    await ride.save();

    req.app.get("io").emit("rideStarted", ride);
    return res.status(StatusCodes.OK).json({ msg: "Ride started", ride });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Start failed" });
  }
};

// UPDATE DRIVER LOCATION & AUTO-COMPLETE
const updateDriverLocation = async (req, res) => {
  try {
    const { rideId, latitude, longitude, speed = 0 } = req.body;
    const driverId = req.user.userId;

    // 1. Get the current socket ID from our memory store
    const currentSocketId = driverSocketMap[driverId] || null;

    // 2. Update the DriverLocation collection
    await DriverLocation.findOneAndUpdate(
      { driver: driverId },
      {
        driver: driverId,
        latitude,
        longitude,
        speed,
        ride: rideId || null,
        socketId: currentSocketId, // Automatically assigned from memory
        isOnline: true,
        updatedAt: new Date(),
      },
      { upsert: true },
    );

    // 2. If there's no rideId, we stop here and return success
    if (!rideId) {
      return res.status(StatusCodes.OK).json({ msg: "Idle location updated" });
    }

    // 3. ACTIVE RIDE LOGIC
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "Ride not found" });
    }

    // Update ride-specific tracking fields
    ride.currentDriverLatitude = latitude;
    ride.currentDriverLongitude = longitude;
    ride.currentSpeed = speed;

    // --- Radius Check: Pickup ---
    const atPickup = isWithinRadius({
      centerLat: ride.pickupLatitude,
      centerLng: ride.pickupLongitude,
      targetLat: latitude,
      targetLng: longitude,
      radiusInKm: 0.08,
    });

    if (atPickup) {
      ride.driverReachedPickup = true;
      if (ride.status === "accepted") ride.status = "driver_arrived";
    }

    // --- Radius Check: Dropoff & Completion Logic ---
    const atDropoff = isWithinRadius({
      centerLat: ride.dropoffLatitude,
      centerLng: ride.dropoffLongitude,
      targetLat: latitude,
      targetLng: longitude,
      radiusInKm: 0.08,
    });

    if (atDropoff && speed < 5) {
      if (!ride.lowSpeedStartedAt) {
        ride.lowSpeedStartedAt = new Date();
      } else if (
        (Date.now() - new Date(ride.lowSpeedStartedAt)) / 1000 >= 5 &&
        ride.status !== "completed"
      ) {
        ride.status = "completed";
        ride.rideCompletedAt = new Date();

        await releaseEscrowToDriver(ride);
        req.app.get("io").emit("rideCompleted", ride);
      }
    } else {
      ride.lowSpeedStartedAt = null;
    }

    await ride.save();
    return res
      .status(StatusCodes.OK)
      .json({ msg: "Active ride location updated" });
  } catch (error) {
    console.error("Location Update Error:", error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Location update failed" });
  }
};

const cancelRide = async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    const ride = await Ride.findById(req.params.rideId);
    if (!ride || ride.status === "completed")
      return res.status(400).json({ msg: "Cannot cancel" });

    const pUser = await User.findById(ride.passenger);
    const pWallet = await Wallet.findOne({ phoneNumber: pUser.phoneNumber });

    if (ride.driverReachedPickup && ride.driver) {
      const dUser = await User.findById(ride.driver);
      const dWallet = await Wallet.findOne({ phoneNumber: dUser.phoneNumber });

      const fee = Math.max(2, ride.estimatedFare * 0.15);

      pWallet.escrowBalance -= ride.estimatedFare;
      pWallet.balance += ride.estimatedFare - fee;
      pWallet.balanceHash = generateBalanceHash(
        pWallet.balance,
        pWallet.escrowBalance,
        pWallet.phoneNumber,
      );

      dWallet.balance += fee;
      dWallet.balanceHash = generateBalanceHash(
        dWallet.balance,
        dWallet.escrowBalance,
        dWallet.phoneNumber,
      );

      await dWallet.save();
    } else {
      pWallet.escrowBalance -= ride.estimatedFare;
      pWallet.balance += ride.estimatedFare;
      pWallet.balanceHash = generateBalanceHash(
        pWallet.balance,
        pWallet.escrowBalance,
        pWallet.phoneNumber,
      );
    }

    await pWallet.save();
    ride.status = "cancelled";
    ride.cancelledBy = req.user.role;
    await ride.save();

    req.app.get("io").emit("rideCancelled", ride);
    return res.status(200).json({ msg: "Ride cancelled" });
  } catch (error) {
    return res.status(500).json({ msg: "Ride cancellation failed" });
  }
};

// MANUAL COMPLETION REQUESTS
const requestRideCompletion = async (req, res) => {
  const ride = await Ride.findById(req.body.rideId);
  if (!ride)
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Ride not found" });
  ride.driverRequestedCompletion = true;
  await ride.save();
  req.app.get("io").emit("rideCompletionRequested", ride);
  return res.status(StatusCodes.OK).json({ msg: "Request sent" });
};

const confirmRideCompletion = async (req, res) => {
  const ride = await Ride.findById(req.body.rideId);
  if (!ride || ride.status === "completed")
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Invalid action" });

  ride.status = "completed";
  ride.passengerConfirmedCompletion = true;
  ride.rideCompletedAt = new Date();
  await releaseEscrowToDriver(ride);
  await ride.save();

  req.app.get("io").emit("rideCompleted", ride);
  return res.status(StatusCodes.OK).json({ msg: "Ride completed", ride });
};

module.exports = {
  estimateRideFare,
  requestRide,
  acceptRide,
  startRide,
  updateDriverLocation,
  cancelRide,
  requestRideCompletion,
  confirmRideCompletion,
};
