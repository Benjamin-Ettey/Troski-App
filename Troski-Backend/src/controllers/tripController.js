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

const rideConfig = require("../config/rideConfig");
const { distanceKm, isInGhana } = require("../utils/geo");
const {
  holdEscrow,
  refundEscrow,
  WalletError,
} = require("../utils/walletService");
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
 * GET /api/v1/trip/nearby?latitude=&longitude=&destination=
 *
 * Lists active Trips heading to the named destination (optional filter)
 * whose driver is currently within DRIVER_SEARCH_RADIUS_KM of the
 * passenger. Each result includes the driver's photo + plate so the
 * passenger can pick visually.
 */
const listNearbyTrips = async (req, res) => {
  const latitude = parseFloat(req.query.latitude);
  const longitude = parseFloat(req.query.longitude);
  const destinationName = (req.query.destination || "").trim();

  if (!isInGhana(latitude, longitude)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Valid latitude and longitude query params required" });
  }

  const filter = { status: { $in: ["open", "in_progress"] } };
  if (destinationName) filter["dropoffLocation.name"] = destinationName;

  const trips = await Trip.find(filter)
    .populate({
      path: "driver",
      populate: { path: "user", select: "name profilePhoto" },
    })
    .populate(
      "vehicle",
      "plateNumber vehicleColor vehicleType vehicleCapacity vehicleImage",
    );

  // Pull all relevant DriverLocations in one query.
  const driverIds = trips.map((t) => t.driver?._id).filter(Boolean);
  const staleCutoff = new Date(Date.now() - rideConfig.DRIVER_LOCATION_STALE_MS);
  const locations = await DriverLocation.find({
    driver: { $in: driverIds },
    isOnline: true,
    lastUpdate: { $gte: staleCutoff },
  });
  const locByDriver = new Map(
    locations.map((l) => [String(l.driver), l]),
  );

  const result = [];
  for (const trip of trips) {
    const remaining =
      (trip.capacity || 0) - trip.activeBookingCount - trip.walkOnCount;
    if (remaining <= 0) continue;

    const loc = locByDriver.get(String(trip.driver?._id));
    if (!loc) continue; // driver location stale or offline

    const distFromMe = distanceKm(
      latitude,
      longitude,
      loc.latitude,
      loc.longitude,
    );
    if (distFromMe > rideConfig.DRIVER_SEARCH_RADIUS_KM) continue;

    result.push({
      tripId: trip._id,
      destination: trip.dropoffLocation,
      farePerPassenger: trip.farePerPassenger,
      remainingSeats: remaining,
      capacity: trip.capacity,
      appBookings: trip.activeBookingCount,
      walkOns: trip.walkOnCount,
      driver: {
        name: trip.driver?.user?.name || null,
        photo: trip.driver?.user?.profilePhoto || null,
      },
      vehicle: {
        plateNumber: trip.vehicle?.plateNumber || null,
        vehicleColor: trip.vehicle?.vehicleColor || null,
        vehicleType: trip.vehicle?.vehicleType || null,
        vehicleImage: trip.vehicle?.vehicleImage || null,
      },
      currentLocation: {
        latitude: loc.latitude,
        longitude: loc.longitude,
        heading: loc.heading,
      },
      driverDistanceKm: parseFloat(distFromMe.toFixed(2)),
      etaMinutes: minutesFromKm(distFromMe),
    });
  }

  result.sort((a, b) => a.etaMinutes - b.etaMinutes);
  res.status(StatusCodes.OK).json({ count: result.length, trips: result });
};

/**
 * POST /api/v1/trip/:id/request-seat
 * Body: { pickup: { latitude, longitude } }
 *
 * Passenger requests a seat on a specific Trip (Mode B direct request).
 * Escrow is held on the passenger's wallet immediately so the driver knows
 * the money is real when they accept.
 */
const requestSeat = async (req, res) => {
  const userId = req.user.passengerId;
  const tripId = req.params.id;
  const { pickup } = req.body || {};

  if (!pickup || !isInGhana(pickup.latitude, pickup.longitude)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Valid pickup coordinates are required" });
  }

  // One active booking at a time.
  const existing = await Booking.findOne({
    passenger: userId,
    status: { $in: ["unassigned", "pending", "accepted", "onboard"] },
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
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Trip is full" });
  }
  if (!trip.farePerPassenger || trip.farePerPassenger <= 0) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Trip has no fare snapshot — cannot process request" });
  }

  const booking = await Booking.create({
    trip: trip._id,
    passenger: userId,
    requestedPickup: {
      latitude: pickup.latitude,
      longitude: pickup.longitude,
    },
    mode: "direct",
    status: "pending",
    fareAmount: trip.farePerPassenger,
    paymentStatus: "unpaid",
  });

  // Hold escrow. If it fails, kill the booking — don't leave a "pending"
  // booking around that the driver might accept and then have no money.
  try {
    await holdEscrow({
      userId,
      amount: trip.farePerPassenger,
      description: `Escrow hold for seat request on trip ${trip._id}`,
      tripId: trip._id,
      bookingId: booking._id,
    });
    booking.paymentStatus = "held";
    await booking.save();
  } catch (err) {
    await Booking.deleteOne({ _id: booking._id });
    if (err instanceof WalletError && err.code === "INSUFFICIENT_FUNDS") {
      return res.status(StatusCodes.PAYMENT_REQUIRED).json({
        msg: "Insufficient wallet balance. Please top up and try again.",
        fareAmount: trip.farePerPassenger,
      });
    }
    console.error("requestSeat escrow failed", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Could not hold escrow. Please try again." });
  }

  // Push the request to the driver with a photo + pickup. Frontend uses
  // this to pop a "new request" card in the driver app.
  const passenger = await Passenger.findById(userId).select(
    "name profilePhoto",
  );
  emit.toDriver(trip.driver, "booking:new", {
    bookingId: booking._id,
    tripId: trip._id,
    requestedPickup: booking.requestedPickup,
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
 * Passenger cancels their own active booking. Refunds escrow.
 */
const cancelMyBooking = async (req, res) => {
  const userId = req.user.passengerId;
  const booking = await Booking.findOne({
    passenger: userId,
    status: { $in: ["pending", "accepted"] },
  });
  if (!booking) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "No cancellable booking" });
  }

  // Refund escrow FIRST. If refund fails, leave the booking active so the
  // passenger can retry rather than ending up cancelled with stuck escrow.
  if (booking.paymentStatus === "held" && booking.fareAmount > 0) {
    try {
      await refundEscrow({
        userId,
        amount: booking.fareAmount,
        description: `Refund — passenger cancelled (booking ${booking._id})`,
        tripId: booking.trip,
        bookingId: booking._id,
      });
      booking.paymentStatus = "refunded";
    } catch (err) {
      console.error("cancelMyBooking refund failed", err);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ msg: "Could not refund. Please contact support." });
    }
  }

  const wasAccepted = booking.status === "accepted";
  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  booking.cancellationReason = req.body?.reason || "passenger cancelled";
  booking.bookingCode = null;
  await booking.save();

  // Free the seat if it had been counted toward the trip
  if (wasAccepted) {
    await Trip.findByIdAndUpdate(booking.trip, {
      $inc: { activeBookingCount: -1 },
    });
  }

  // Notify driver
  const trip = await Trip.findById(booking.trip).select("driver");
  if (trip?.driver) {
    emit.toDriver(trip.driver, "booking:cancelled", {
      bookingId: booking._id,
      reason: "passenger cancelled",
    });
  }

  res.status(StatusCodes.OK).json({ msg: "Booking cancelled", booking });
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
  listNearbyTrips,
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
