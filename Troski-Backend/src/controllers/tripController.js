// ============================================================
// TRIP CONTROLLER — Mode B (passenger picks driver on map).
//
// Driver creates the Trip via /driver-location/online with a destination.
// Passengers list nearby active trips, tap one, and request a seat. The
// driver gets a notification with the passenger's photo + pickup and
// either accepts (issuing a 4-digit booking code) or rejects.
//
// Mode A (cluster of 5+ unassigned bookings) is a separate flow added in
// Phase 5; it shares the booking lifecycle (acceptance → onboard →
// arrived) but starts from a different request path.
// ============================================================

const { StatusCodes } = require("http-status-codes");

const Trip = require("../models/trips");
const Booking = require("../models/bookings");
const Driver = require("../models/drivers");
const Passenger = require("../models/passengers");
const DriverLocation = require("../models/driverLocations");

const crypto = require("crypto");

const rideConfig = require("../config/rideConfig");
const { distanceKm, isInGhana } = require("../utils/geo");
const { computeFare } = require("../utils/fareService");
const { evaluateEnroute } = require("../utils/routeMatching");
const {
  holdEscrow,
  refundEscrow,
  creditWallet,
  settleCancellationPenalty,
  WalletError,
} = require("../utils/walletService");
const { chargeMobileMoney } = require("../utils/paystackUtils");
const Payment = require("../models/payments");
const { emit } = require("../socket/emit");

// Naive ETA: distance / average urban speed. Good enough for v1; swap in
// Google Distance Matrix later when we want road-accurate numbers.
const AVG_URBAN_SPEED_KMH = 25;
const minutesFromKm = (km) =>
  km == null ? null : Math.max(1, Math.round((km / AVG_URBAN_SPEED_KMH) * 60));

// 4-digit booking code generator. Codes from 1000-9999 (no leading zero
// confusion when read aloud).
const generateBookingCode = () =>
  String(Math.floor(1000 + Math.random() * 9000));

// Lean public view of a Trip — strips internals.
function publicTripView(trip) {
  if (!trip) return null;
  const t = trip.toObject ? trip.toObject() : trip;
  return {
    _id: t._id,
    dropoffLocation: t.dropoffLocation,
    status: t.status,
    capacity: t.capacity,
    activeBookingCount: t.activeBookingCount,
    walkOnCount: t.walkOnCount,
    remainingSeats:
      (t.capacity || 0) -
      (t.activeBookingCount || 0) -
      (t.walkOnCount || 0),
    farePerPassenger: t.farePerPassenger,
    driverPayPerPassenger: t.driverPayPerPassenger,
    platformProfitPerPassenger: t.platformProfitPerPassenger,
    pickupZone: t.pickupZone,
    dropoffZone: t.dropoffZone,
    driver: t.driver || null,
    vehicle: t.vehicle || null,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
  };
}

// ============================================================
// PASSENGER ENDPOINTS
// ============================================================

/**
 * POST /api/v1/trip/search
 * Body: { pickup: {latitude, longitude}, dropoff: {latitude, longitude, name} }
 *
 * Finds active trips whose route passes through the passenger's pickup AND
 * drop-off (enroute), with seats available, within search radius. Returns
 * a per-passenger fare quote + ETA + seats — but deliberately NO live
 * driver position. The driver's exact location is only revealed after they
 * accept a request (anti-freeloading: stops people watching trotros
 * approach and street-hailing to dodge the fare).
 */
const searchTrips = async (req, res) => {
  const { pickup, dropoff } = req.body || {};
  if (
    !pickup ||
    !isInGhana(pickup.latitude, pickup.longitude) ||
    !dropoff ||
    !isInGhana(dropoff.latitude, dropoff.longitude)
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Valid pickup and drop-off coordinates are required",
    });
  }

  const trips = await Trip.find({
    status: { $in: ["open", "in_progress"] },
  }).populate(
    "vehicle",
    "plateNumber vehicleColor vehicleType vehicleCapacity vehicleImage",
  );

  const driverIds = trips.map((t) => t.driver).filter(Boolean);
  const staleCutoff = new Date(Date.now() - rideConfig.DRIVER_LOCATION_STALE_MS);
  const locations = await DriverLocation.find({
    driver: { $in: driverIds },
    isOnline: true,
    lastUpdate: { $gte: staleCutoff },
  });
  const locByDriver = new Map(locations.map((l) => [String(l.driver), l]));

  const results = [];
  for (const trip of trips) {
    const remaining =
      (trip.capacity || 0) - trip.activeBookingCount - trip.walkOnCount;
    if (remaining <= 0) continue;

    const loc = locByDriver.get(String(trip.driver));
    if (!loc) continue;

    // Driver must be reasonably near the passenger's pickup.
    const driverToPickupKm = distanceKm(
      loc.latitude,
      loc.longitude,
      pickup.latitude,
      pickup.longitude,
    );
    if (driverToPickupKm > rideConfig.DRIVER_SEARCH_RADIUS_KM) continue;

    // Is the passenger's pickup+dropoff enroute for this trip?
    const enroute = evaluateEnroute({
      pickup,
      dropoff,
      encodedPolyline: trip.routePolyline,
      driverLocation: { latitude: loc.latitude, longitude: loc.longitude },
      finalDestination: {
        latitude: trip.dropoffLocation.latitude,
        longitude: trip.dropoffLocation.longitude,
      },
    });
    if (!enroute.match) continue;

    // Per-passenger fare for the distance THEY travel.
    const fare = computeFare({
      pickup,
      dropoff,
      distanceKmOverride: enroute.fareDistanceKm,
    });
    if (!fare) continue;

    results.push({
      tripId: trip._id,
      finalDestination: trip.dropoffLocation,
      yourDropoff: dropoff,
      yourFare: fare.fare,
      fareDistanceKm: parseFloat((enroute.fareDistanceKm || 0).toFixed(2)),
      remainingSeats: remaining,
      vehicle: {
        vehicleType: trip.vehicle?.vehicleType || null,
        vehicleColor: trip.vehicle?.vehicleColor || null,
        // plate intentionally withheld until acceptance
      },
      // ETA for the driver to reach the passenger's pickup. Position itself
      // is NOT included.
      etaMinutes: minutesFromKm(driverToPickupKm),
    });
  }

  results.sort((a, b) => a.etaMinutes - b.etaMinutes);
  res.status(StatusCodes.OK).json({ count: results.length, trips: results });
};

/**
 * POST /api/v1/trip/:id/request-seat
 * Body: {
 *   pickup: {latitude, longitude},
 *   dropoff: {latitude, longitude, name},
 *   paymentMethod: "wallet" | "paystack",
 *   mobileMoney?: { phone, provider }      // required if paymentMethod === "paystack"
 * }
 *
 * Passenger requests a seat on a specific Trip. Drop-off must be enroute;
 * fare is computed for the distance they actually travel. Payment is taken
 * one of two ways:
 *
 *   wallet   → existing escrow flow: holdEscrow on the passenger's wallet,
 *              booking immediately becomes "pending" and visible to driver.
 *   paystack → chargeMobileMoney against the passenger's MoMo. Booking sits
 *              in "awaiting_payment" until the webhook confirms; only then
 *              does it flip to "pending" and reach the driver.
 */
const requestSeat = async (req, res) => {
  const userId = req.user.passengerId;
  const tripId = req.params.id;
  const { pickup, dropoff, paymentMethod, mobileMoney } = req.body || {};

  // ── Coordinate validation ──
  if (!pickup || !isInGhana(pickup.latitude, pickup.longitude)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Valid pickup coordinates are required" });
  }
  if (!dropoff || !isInGhana(dropoff.latitude, dropoff.longitude)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Valid drop-off coordinates are required" });
  }

  // ── Payment method validation ──
  const method = paymentMethod === "paystack" ? "paystack" : "wallet";
  if (method === "paystack") {
    if (
      !mobileMoney ||
      !mobileMoney.phone ||
      !["mtn", "vodafone", "tigo"].includes(mobileMoney.provider)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "paystack payment requires mobileMoney: { phone, provider } where provider is mtn/vodafone/tigo",
      });
    }
  }

  // One active booking at a time.
  const existing = await Booking.findOne({
    passenger: userId,
    status: {
      $in: ["awaiting_payment", "unassigned", "pending", "accepted", "onboard"],
    },
  });
  if (existing) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "You already have an active booking. Cancel it first.",
      booking: existing,
    });
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Trip not found" });
  }
  if (!["open", "in_progress"].includes(trip.status)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "This trip is no longer accepting passengers" });
  }
  const remaining =
    (trip.capacity || 0) - trip.activeBookingCount - trip.walkOnCount;
  if (remaining <= 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Trip is full" });
  }

  // Driver's current position for enroute evaluation.
  const driverLoc = await DriverLocation.findOne({ driver: trip.driver });

  const enroute = evaluateEnroute({
    pickup,
    dropoff,
    encodedPolyline: trip.routePolyline,
    driverLocation: driverLoc
      ? { latitude: driverLoc.latitude, longitude: driverLoc.longitude }
      : null,
    finalDestination: {
      latitude: trip.dropoffLocation.latitude,
      longitude: trip.dropoffLocation.longitude,
    },
  });
  if (!enroute.match) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: `This trip can't take you there: ${enroute.reason}`,
    });
  }

  // Per-passenger fare. Snapshot driverPay + platformProfit on the
  // Booking so settlement at trip-end uses frozen numbers.
  const fare = computeFare({
    pickup,
    dropoff,
    distanceKmOverride: enroute.fareDistanceKm,
  });
  if (!fare || !fare.fare || fare.fare <= 0) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Pickup/drop-off outside the serviceable area" });
  }

  // Booking starts as 'awaiting_payment' for paystack flow; we promote it
  // to 'pending' as soon as the wallet hold succeeds or webhook confirms.
  const booking = await Booking.create({
    trip: trip._id,
    passenger: userId,
    requestedPickup: { latitude: pickup.latitude, longitude: pickup.longitude },
    dropoffLocation: {
      name: dropoff.name || null,
      latitude: dropoff.latitude,
      longitude: dropoff.longitude,
    },
    fareDistanceKm: enroute.fareDistanceKm,
    mode: "direct",
    status: method === "paystack" ? "awaiting_payment" : "pending",
    fareAmount: fare.fare,
    driverPayAmount: fare.driverPay,
    platformProfitAmount: fare.platformProfit,
    paymentStatus: "unpaid",
    paymentMethod: method,
  });

  if (method === "wallet") {
    // ── Wallet path: hold escrow immediately ──
    try {
      await holdEscrow({
        userId,
        amount: fare.fare,
        description: `Escrow hold for seat on trip ${trip._id}`,
        tripId: trip._id,
        bookingId: booking._id,
      });
      booking.paymentStatus = "held";
      await booking.save();
    } catch (err) {
      await Booking.deleteOne({ _id: booking._id });
      if (err instanceof WalletError && err.code === "INSUFFICIENT_FUNDS") {
        return res.status(StatusCodes.PAYMENT_REQUIRED).json({
          msg: "Insufficient wallet balance. Top up or use Paystack instead.",
          fareAmount: fare.fare,
        });
      }
      console.error("requestSeat (wallet) escrow failed", err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ msg: "Could not hold escrow. Please try again." });
    }
  } else {
    // ── Paystack path: charge MoMo; booking waits for webhook confirm ──
    const reference = `RIDE_${booking._id}_${crypto
      .randomBytes(6)
      .toString("hex")}`;
    booking.paystackChargeReference = reference;
    await booking.save();

    // Create a Payment row up front so the webhook can resolve it even if
    // our process dies between the charge call and getting a response.
    const passengerUser = await Passenger.findById(userId).select(
      "email phoneNumber",
    );
    await Payment.create({
      booking: booking._id,
      trip: trip._id,
      passenger: userId,
      paymentType: "ride_payment",
      phoneNumber: mobileMoney.phone,
      amount: fare.fare,
      currency: "GHS",
      paymentProvider: "paystack",
      paystackReference: reference,
      status: "pending",
    });

    try {
      await chargeMobileMoney({
        email:
          passengerUser?.email || `${mobileMoney.phone}@troski.placeholder`,
        amountGHS: fare.fare,
        reference,
        phone: mobileMoney.phone,
        provider: mobileMoney.provider,
      });
    } catch (err) {
      // Charge initiation failed — kill the booking and the Payment row.
      console.error("requestSeat (paystack) charge init failed", err.message);
      await Booking.deleteOne({ _id: booking._id });
      await Payment.deleteOne({ paystackReference: reference });
      return res.status(StatusCodes.BAD_GATEWAY).json({
        msg: "Could not start mobile money charge. Please try again.",
      });
    }

    return res.status(StatusCodes.CREATED).json({
      msg: "Authorize the payment on your phone to complete the booking.",
      booking,
      paystackReference: reference,
      paymentStatus: "awaiting_authorization",
    });
  }

  // For the wallet path we reach here with a fully held booking → tell driver.
  const passenger = await Passenger.findById(userId).select(
    "name profilePhoto",
  );
  emit.toDriver(trip.driver, "booking:new", {
    bookingId: booking._id,
    tripId: trip._id,
    requestedPickup: booking.requestedPickup,
    dropoff: booking.dropoffLocation,
    fareAmount: booking.fareAmount,
    passenger: {
      _id: userId,
      name: passenger?.name || null,
      photo: passenger?.profilePhoto || null,
    },
  });

  res.status(StatusCodes.CREATED).json({
    msg: "Request sent. Waiting for the driver to accept.",
    booking,
  });
};

/**
 * GET /api/v1/trip/my-booking
 * Returns the passenger's current active booking with driver/vehicle/
 * location details for the in-app tracking screen.
 */
const getMyActiveBooking = async (req, res) => {
  const booking = await Booking.findOne({
    passenger: req.user.passengerId,
    status: { $in: ["pending", "accepted", "onboard"] },
  }).populate("trip");

  if (!booking) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "No active booking" });
  }

  let driverInfo = null;
  let vehicleInfo = null;
  let currentLocation = null;
  let etaMinutes = null;

  if (booking.trip?.driver) {
    const driverProfile = await Driver.findById(booking.trip.driver)
      .populate("user", "name profilePhoto")
      .populate("vehicle", "plateNumber vehicleColor vehicleType vehicleImage");

    if (driverProfile) {
      driverInfo = {
        name: driverProfile.user?.name || null,
        photo: driverProfile.user?.profilePhoto || null,
      };
      vehicleInfo = {
        plateNumber: driverProfile.vehicle?.plateNumber || null,
        vehicleColor: driverProfile.vehicle?.vehicleColor || null,
        vehicleType: driverProfile.vehicle?.vehicleType || null,
        vehicleImage: driverProfile.vehicle?.vehicleImage || null,
      };
    }

    const loc = await DriverLocation.findOne({ driver: booking.trip.driver });
    if (loc) {
      currentLocation = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        heading: loc.heading,
      };
      // ETA only meaningful before pickup
      if (["accepted", "pending"].includes(booking.status)) {
        const km = distanceKm(
          loc.latitude,
          loc.longitude,
          booking.requestedPickup.latitude,
          booking.requestedPickup.longitude,
        );
        etaMinutes = minutesFromKm(km);
      }
    }
  }

  res.status(StatusCodes.OK).json({
    booking,
    trip: publicTripView(booking.trip),
    driver: driverInfo,
    vehicle: vehicleInfo,
    currentLocation,
    etaMinutes,
    bookingCode: booking.bookingCode, // shown to passenger when accepted
  });
};

/**
 * PATCH /api/v1/trip/booking/cancel
 * Body: { reason? }
 *
 * Cancellation policy:
 *   - Booking in awaiting_payment / pending (driver hasn't accepted) →
 *     full refund (back to wallet for wallet-paid, wallet credit for
 *     paystack-paid).
 *   - Booking accepted (driver committed, possibly en route) → NO refund.
 *     The held fare is split: PASSENGER_CANCEL_DRIVER_SHARE % to the
 *     driver, PASSENGER_CANCEL_PLATFORM_SHARE % to the platform.
 *   - Booking onboard → not cancellable; passenger is in the vehicle.
 */
const cancelMyBooking = async (req, res) => {
  const userId = req.user.passengerId;
  const booking = await Booking.findOne({
    passenger: userId,
    status: { $in: ["awaiting_payment", "pending", "accepted"] },
  });
  if (!booking) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "No cancellable booking" });
  }

  const reason = req.body?.reason || "passenger cancelled";
  const trip = await Trip.findById(booking.trip);

  // ── awaiting_payment: nothing's held yet (charge in flight). Just
  //    mark cancelled. The webhook will refund-to-wallet if the charge
  //    arrives after this.
  if (booking.status === "awaiting_payment") {
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    await booking.save();
    return res.status(StatusCodes.OK).json({
      msg: "Booking cancelled before payment was confirmed",
      booking,
    });
  }

  // ── pending: full refund, no penalty.
  if (booking.status === "pending") {
    try {
      if (booking.paymentStatus === "held" && booking.fareAmount > 0) {
        if (booking.paymentMethod === "wallet") {
          await refundEscrow({
            userId,
            amount: booking.fareAmount,
            description: `Refund — passenger cancelled (booking ${booking._id})`,
            tripId: booking.trip,
            bookingId: booking._id,
          });
        } else {
          // Paystack-paid → credit wallet (money's in our Paystack
          // account; cheaper to credit internally than to call Paystack
          // refund API).
          await creditWallet({
            userId,
            amount: booking.fareAmount,
            description: `Refund — passenger cancelled (booking ${booking._id})`,
            tripId: booking.trip,
            bookingId: booking._id,
            reference: booking.paystackChargeReference,
          });
        }
        booking.paymentStatus = "refunded";
      }
    } catch (err) {
      console.error("cancelMyBooking refund failed", err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ msg: "Could not refund. Please contact support." });
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    booking.bookingCode = null;
    await booking.save();

    if (trip?.driver) {
      emit.toDriver(trip.driver, "booking:cancelled", {
        bookingId: booking._id,
        reason: "passenger cancelled",
      });
    }
    return res.status(StatusCodes.OK).json({
      msg: "Booking cancelled, full refund issued",
      booking,
    });
  }

  // ── accepted: the penalty applies. Split fare 70/30 (or whatever
  //    rideConfig says), no refund to passenger.
  // We need driverProfile + driver.user for the settle helper.
  const Driver = require("../models/drivers");
  const driverProfile = await Driver.findById(trip.driver);
  if (!driverProfile) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Driver profile missing — can't settle cancellation" });
  }

  const total = booking.fareAmount || 0;
  const driverShare =
    Math.round(total * rideConfig.PASSENGER_CANCEL_DRIVER_SHARE * 100) / 100;
  const platformShare = Math.round((total - driverShare) * 100) / 100;

  try {
    if (total > 0) {
      await settleCancellationPenalty({
        paymentMethod: booking.paymentMethod || "wallet",
        passengerUserId: userId,
        driverUserId: driverProfile.user,
        driverProfileId: driverProfile._id,
        totalAmount: total,
        driverShare,
        platformShare,
        tripId: booking.trip,
        bookingId: booking._id,
      });
    }
  } catch (err) {
    console.error("cancelMyBooking penalty settle failed", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Could not process cancellation. Please contact support." });
  }

  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  booking.cancellationReason = reason;
  booking.bookingCode = null;
  booking.paymentStatus = "paid"; // money fully accounted for (to driver+platform)
  await booking.save();

  // Free the seat
  await Trip.findByIdAndUpdate(booking.trip, {
    $inc: { activeBookingCount: -1 },
  });

  if (trip?.driver) {
    emit.toDriver(trip.driver, "booking:cancelled", {
      bookingId: booking._id,
      reason: "passenger cancelled (after accept — penalty paid out)",
      driverShare,
    });
  }

  res.status(StatusCodes.OK).json({
    msg: "Booking cancelled. Cancellation penalty applied — no refund.",
    booking,
    penalty: {
      total,
      driverShare,
      platformShare,
    },
  });
};

/**
 * POST /api/v1/trip/booking/confirm-boarding
 * Body: { code }
 *
 * Passenger enters the 4-digit code their driver was given when accepting.
 * Marks the booking as onboard and notifies the driver. The code is
 * cleared once used.
 */
const confirmBoarding = async (req, res) => {
  const { code } = req.body || {};
  if (!code || typeof code !== "string" || !/^\d{4}$/.test(code)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "A 4-digit booking code is required" });
  }

  const booking = await Booking.findOne({
    passenger: req.user.passengerId,
    status: "accepted",
  });
  if (!booking) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "No accepted booking to confirm. Has the driver accepted yet?",
    });
  }

  if (booking.bookingCode !== code) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "Invalid booking code" });
  }

  booking.status = "onboard";
  booking.onboardedAt = new Date();
  booking.bookingCode = null;
  await booking.save();

  // First passenger boards → trip moves from open to in_progress
  const trip = await Trip.findById(booking.trip);
  if (trip && trip.status === "open") {
    trip.status = "in_progress";
    trip.startedAt = new Date();
    await trip.save();
  }

  if (trip?.driver) {
    emit.toDriver(trip.driver, "booking:onboarded", {
      bookingId: booking._id,
      passengerId: req.user.passengerId,
    });
  }

  res.status(StatusCodes.OK).json({ msg: "Boarding confirmed", booking });
};

// ============================================================
// DRIVER ENDPOINTS
// ============================================================

/**
 * GET /api/v1/trip/my-trip
 * Driver's currently-active trip plus all active bookings + seat state.
 */
const getMyActiveTrip = async (req, res) => {
  const driverProfile = await Driver.findOne({ user: req.user.passengerId });
  if (!driverProfile) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "No driver profile" });
  }
  if (!driverProfile.activeTrip) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "No active trip. Go online to start one." });
  }

  const trip = await Trip.findById(driverProfile.activeTrip);
  if (!trip) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Trip not found" });
  }

  const bookings = await Booking.find({
    trip: trip._id,
    status: { $in: ["pending", "accepted", "onboard"] },
  }).populate("passenger", "name profilePhoto phoneNumber");

  res.status(StatusCodes.OK).json({
    trip: publicTripView(trip),
    bookings,
  });
};

/**
 * GET /api/v1/trip/incoming-requests
 * Pending (not yet accepted/rejected) bookings on the driver's active trip.
 */
const listIncomingRequests = async (req, res) => {
  const driverProfile = await Driver.findOne({ user: req.user.passengerId });
  if (!driverProfile || !driverProfile.activeTrip) {
    return res.status(StatusCodes.OK).json({ count: 0, bookings: [] });
  }

  const bookings = await Booking.find({
    trip: driverProfile.activeTrip,
    status: "pending",
  }).populate("passenger", "name profilePhoto phoneNumber");

  res.status(StatusCodes.OK).json({ count: bookings.length, bookings });
};

/**
 * PATCH /api/v1/trip/booking/:id/accept
 *
 * Driver accepts a pending booking. Generates a 4-digit code, atomically
 * increments the trip's seat counter (refusing if it would overflow), and
 * notifies the passenger with the code + driver info + ETA.
 */
const acceptBooking = async (req, res) => {
  const driverProfile = await Driver.findOne({
    user: req.user.passengerId,
  }).populate("vehicle");
  if (!driverProfile) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "No driver profile" });
  }

  const booking = await Booking.findOne({
    _id: req.params.id,
    status: "pending",
  });
  if (!booking) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Booking not found or already handled",
    });
  }

  const trip = await Trip.findById(booking.trip);
  if (!trip || String(trip.driver) !== String(driverProfile._id)) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "This booking isn't on your trip" });
  }
  if (!["open", "in_progress"].includes(trip.status)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Trip is no longer accepting bookings" });
  }

  // Atomic capacity check + increment
  const updatedTrip = await Trip.findOneAndUpdate(
    {
      _id: trip._id,
      $expr: {
        $lt: [
          { $add: ["$activeBookingCount", "$walkOnCount"] },
          "$capacity",
        ],
      },
    },
    { $inc: { activeBookingCount: 1 } },
    { new: true },
  );
  if (!updatedTrip) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Vehicle is full. You cannot accept this booking.",
    });
  }

  const bookingCode = generateBookingCode();
  booking.status = "accepted";
  booking.acceptedAt = new Date();
  booking.bookingCode = bookingCode;
  await booking.save();

  // Compute ETA from driver's current location to passenger's pickup
  let etaMinutes = null;
  const driverLoc = await DriverLocation.findOne({
    driver: driverProfile._id,
  });
  if (driverLoc) {
    const km = distanceKm(
      driverLoc.latitude,
      driverLoc.longitude,
      booking.requestedPickup.latitude,
      booking.requestedPickup.longitude,
    );
    etaMinutes = minutesFromKm(km);
  }

  const driverUser = await Passenger.findById(driverProfile.user).select(
    "name profilePhoto",
  );

  // Notify passenger
  emit.toUser(booking.passenger, "booking:accepted", {
    bookingId: booking._id,
    bookingCode,
    etaMinutes,
    pickup: booking.requestedPickup,
    driver: {
      name: driverUser?.name || null,
      photo: driverUser?.profilePhoto || null,
    },
    vehicle: {
      plateNumber: driverProfile.vehicle?.plateNumber || null,
      vehicleColor: driverProfile.vehicle?.vehicleColor || null,
      vehicleType: driverProfile.vehicle?.vehicleType || null,
    },
    currentLocation: driverLoc
      ? {
          latitude: driverLoc.latitude,
          longitude: driverLoc.longitude,
          heading: driverLoc.heading,
        }
      : null,
  });

  res.status(StatusCodes.OK).json({
    msg: "Booking accepted",
    booking: {
      _id: booking._id,
      bookingCode,
      etaMinutes,
      passenger: booking.passenger,
      requestedPickup: booking.requestedPickup,
      fareAmount: booking.fareAmount,
    },
    trip: publicTripView(updatedTrip),
  });
};

/**
 * PATCH /api/v1/trip/booking/:id/reject
 * Body: { reason? }
 *
 * Driver declines a pending booking. Refunds the held escrow.
 */
const rejectBooking = async (req, res) => {
  const driverProfile = await Driver.findOne({ user: req.user.passengerId });
  if (!driverProfile) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "No driver profile" });
  }

  const booking = await Booking.findOne({
    _id: req.params.id,
    status: "pending",
  });
  if (!booking) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Booking not found or already handled",
    });
  }

  const trip = await Trip.findById(booking.trip).select("driver");
  if (!trip || String(trip.driver) !== String(driverProfile._id)) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "This booking isn't on your trip" });
  }

  if (booking.paymentStatus === "held" && booking.fareAmount > 0) {
    try {
      await refundEscrow({
        userId: booking.passenger,
        amount: booking.fareAmount,
        description: `Refund — driver rejected (booking ${booking._id})`,
        tripId: booking.trip,
        bookingId: booking._id,
      });
      booking.paymentStatus = "refunded";
    } catch (err) {
      console.error("rejectBooking refund failed", err);
      // Continue — flag the booking as rejected anyway; refund reconcile
      // can be handled by an admin or background job.
    }
  }

  booking.status = "rejected";
  booking.cancelledAt = new Date();
  booking.cancellationReason = req.body?.reason || "driver rejected";
  booking.bookingCode = null;
  await booking.save();

  emit.toUser(booking.passenger, "booking:rejected", {
    bookingId: booking._id,
    reason: booking.cancellationReason,
  });

  res.status(StatusCodes.OK).json({ msg: "Booking rejected", booking });
};

/**
 * PATCH /api/v1/trip/booking/:id/mark-boarded
 *
 * Driver-side fallback for when the passenger can't or doesn't enter the
 * booking code (e.g., dead phone). The driver marks them boarded directly.
 * Same end state as the passenger's /confirm-boarding.
 */
const markBoarded = async (req, res) => {
  const driverProfile = await Driver.findOne({ user: req.user.passengerId });
  if (!driverProfile) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "No driver profile" });
  }

  const booking = await Booking.findOne({
    _id: req.params.id,
    status: "accepted",
  });
  if (!booking) {
    return res.status(StatusCodes.NOT_FOUND).json({
      msg: "Booking not found or not in accepted state",
    });
  }

  const trip = await Trip.findById(booking.trip);
  if (!trip || String(trip.driver) !== String(driverProfile._id)) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "This booking isn't on your trip" });
  }

  booking.status = "onboard";
  booking.onboardedAt = new Date();
  booking.bookingCode = null;
  await booking.save();

  if (trip.status === "open") {
    trip.status = "in_progress";
    trip.startedAt = new Date();
    await trip.save();
  }

  emit.toUser(booking.passenger, "booking:onboarded", {
    bookingId: booking._id,
  });

  res.status(StatusCodes.OK).json({ msg: "Marked boarded", booking });
};

module.exports = {
  // Passenger
  searchTrips,
  requestSeat,
  getMyActiveBooking,
  cancelMyBooking,
  confirmBoarding,

  // Driver
  getMyActiveTrip,
  listIncomingRequests,
  acceptBooking,
  rejectBooking,
  markBoarded,
};
