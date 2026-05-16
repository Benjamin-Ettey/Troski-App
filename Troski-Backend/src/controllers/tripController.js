// ============================================================
// TRIP CONTROLLER — demand-aggregation ride system.
//
// Passenger places a "ride order" (a Booking). The system clusters
// nearby bookings going to the same dropoff into a single Trip. Trips
// stay HIDDEN from drivers until they hit MIN_PASSENGERS_FOR_DRIVERS,
// then they're broadcast to nearby drivers whose route preferences
// include the dropoff.
// ============================================================

const { StatusCodes } = require("http-status-codes");
const Trip = require("../models/trips");
const Booking = require("../models/bookings");
const Driver = require("../models/drivers");
const Vehicle = require("../models/Vehicle");
const DriverLocation = require("../models/driverLocations");
const rideConfig = require("../config/rideConfig");
const {
  distanceMeters,
  distanceKm,
  centroidOf,
  isInGhana,
} = require("../utils/geo");
const { emit } = require("../socket/emit");
const { computeFare } = require("../utils/fareService");
const {
  holdEscrow,
  refundEscrow,
  settleBookingPayout,
  WalletError,
} = require("../utils/walletService");

// ============================================================
// PASSENGER-FACING
// ============================================================

// POST /api/v1/trip/request
// Body: { pickup: { latitude, longitude, name? }, dropoff: { latitude, longitude, name } }
const requestRide = async (req, res) => {
  const userId = req.user.passengerId;
  const { pickup, dropoff } = req.body || {};

  if (
    !pickup ||
    !dropoff ||
    !isInGhana(pickup.latitude, pickup.longitude) ||
    !isInGhana(dropoff.latitude, dropoff.longitude) ||
    !dropoff.name
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Valid pickup coordinates, dropoff coordinates, and dropoff name are required.",
    });
  }

  // A passenger can only have one active booking at a time
  const existing = await Booking.findOne({ passenger: userId, status: "active" });
  if (existing) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "You already have an active ride. Cancel it before booking another.",
      booking: existing,
    });
  }

  // Find a Trip we can join: same dropoff name, joinable status,
  // pickup pin within cluster radius of the trip's centroid, has room.
  const joinable = await Trip.find({
    "dropoffLocation.name": dropoff.name,
    status: { $in: ["forming", "open_for_drivers", "driver_assigned"] },
  });

  let trip = null;
  let smallestDist = Infinity;
  for (const t of joinable) {
    if (t.capacity && t.activeBookingCount >= t.capacity) continue;
    const d = distanceMeters(
      pickup.latitude,
      pickup.longitude,
      t.pickupLocation.latitude,
      t.pickupLocation.longitude,
    );
    if (d <= t.pickupRadiusMeters && d < smallestDist) {
      smallestDist = d;
      trip = t;
    }
  }

  // No matching trip → compute the fare and start a new one (status "forming").
  // For an existing trip, the fare is locked in trip.farePerPassenger.
  let fareDetails = null;
  let newTripCreated = false;
  if (!trip) {
    fareDetails = computeFare({ pickup, dropoff });
    if (!fareDetails) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Could not determine fare for this route. Please verify coordinates.",
      });
    }

    trip = await Trip.create({
      pickupLocation: {
        latitude: pickup.latitude,
        longitude: pickup.longitude,
        name: pickup.name || fareDetails.pickupTown,
      },
      dropoffLocation: {
        latitude: dropoff.latitude,
        longitude: dropoff.longitude,
        name: dropoff.name,
      },
      pickupZone: fareDetails.pickupZone,
      dropoffZone: fareDetails.dropoffZone,
      farePerPassenger: fareDetails.fare,
      driverPayPerPassenger: fareDetails.driverPay,
      platformProfitPerPassenger: fareDetails.platformProfit,
      status: "forming",
      activeBookingCount: 0,
    });
    newTripCreated = true;
  }

  const fareAmount = trip.farePerPassenger;

  // Create the Booking (with the fare snapshotted from the trip). Marked
  // `pending` until escrow is successfully held.
  const booking = await Booking.create({
    trip: trip._id,
    passenger: userId,
    requestedPickup: {
      latitude: pickup.latitude,
      longitude: pickup.longitude,
    },
    fareAmount,
    paymentStatus: "unpaid",
    status: "active",
  });

  // ---- ESCROW HOLD ----
  // Move fareAmount from the passenger's balance into escrow. If this fails
  // (insufficient funds, integrity error, etc.), we roll back:
  //   - delete the booking
  //   - if we created the trip in this request and it has no other bookings,
  //     delete it too.
  try {
    await holdEscrow({
      userId,
      amount: fareAmount,
      description: `Escrow hold for trip ${trip._id}`,
      tripId: trip._id,
      bookingId: booking._id,
    });
    booking.paymentStatus = "held";
    await booking.save();
  } catch (err) {
    await Booking.deleteOne({ _id: booking._id });
    if (newTripCreated) {
      // Best-effort cleanup of the orphaned trip
      await Trip.deleteOne({
        _id: trip._id,
        activeBookingCount: 0,
      });
    }
    if (err instanceof WalletError && err.code === "INSUFFICIENT_FUNDS") {
      return res.status(StatusCodes.PAYMENT_REQUIRED).json({
        msg: "Insufficient wallet balance. Please top up and try again.",
        fareAmount,
      });
    }
    console.error("requestRide escrow failed", err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Could not hold escrow for your booking. Please try again.",
    });
  }

  // Recompute centroid if trip is still pre-pickup (i.e., centroid is
  // still the meeting point; once driver is en route we freeze it).
  if (["forming", "open_for_drivers"].includes(trip.status)) {
    const points = await Booking.find({
      trip: trip._id,
      status: "active",
    }).select("requestedPickup");
    const pickupPoints = points.map((b) => ({
      latitude: b.requestedPickup.latitude,
      longitude: b.requestedPickup.longitude,
    }));
    const c = centroidOf(pickupPoints);
    if (c) {
      trip.pickupLocation.latitude = c.latitude;
      trip.pickupLocation.longitude = c.longitude;
    }
  }

  trip.activeBookingCount += 1;

  // Threshold check: promote to open_for_drivers when MIN reached
  let justOpened = false;
  if (
    trip.status === "forming" &&
    trip.activeBookingCount >= trip.minPassengers
  ) {
    trip.status = "open_for_drivers";
    trip.openedAt = new Date();
    justOpened = true;
  }

  await trip.save();

  // Emit live updates
  emit.toTripPassengers(trip._id, "trip:booking_count", {
    tripId: trip._id,
    count: trip.activeBookingCount,
    threshold: trip.minPassengers,
    status: trip.status,
  });

  if (justOpened) {
    // Broadcast to nearby online drivers whose vehicle routes match.
    await broadcastTripToDrivers(trip);
  } else if (trip.status === "driver_assigned" && trip.driver) {
    // Late joiner — let the driver know
    emit.toDriver(trip.driver, "trip:passenger_joined", {
      tripId: trip._id,
      bookingId: booking._id,
      currentCount: trip.activeBookingCount,
    });
  }

  res.status(StatusCodes.CREATED).json({
    msg: "Booking created",
    booking,
    trip: publicTripView(trip),
  });
};

// GET /api/v1/trip/my-booking
const getMyActiveBooking = async (req, res) => {
  const booking = await Booking.findOne({
    passenger: req.user.passengerId,
    status: "active",
  }).populate("trip");
  if (!booking) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "No active booking" });
  }
  res.status(StatusCodes.OK).json({
    booking,
    trip: publicTripView(booking.trip),
  });
};

// PATCH /api/v1/trip/booking/cancel
const cancelBooking = async (req, res) => {
  const booking = await Booking.findOne({
    passenger: req.user.passengerId,
    status: "active",
  });
  if (!booking) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "No active booking" });
  }

  const trip = await Trip.findById(booking.trip);
  if (!trip) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Trip not found" });
  }

  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  booking.cancellationReason = req.body?.reason || null;

  // Refund the escrow back to the passenger's spendable balance. We do this
  // BEFORE saving the booking-cancelled state so that if the refund fails,
  // the booking stays active and the passenger can retry (rather than
  // ending up cancelled with stuck escrow).
  if (booking.paymentStatus === "held" && booking.fareAmount > 0) {
    try {
      await refundEscrow({
        userId: req.user.passengerId,
        amount: booking.fareAmount,
        description: `Refund for cancelled booking ${booking._id}`,
        tripId: trip._id,
        bookingId: booking._id,
      });
      booking.paymentStatus = "refunded";
    } catch (err) {
      console.error("cancelBooking refund failed", err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        msg: "Could not refund your booking. Please contact support.",
      });
    }
  }

  await booking.save();

  trip.activeBookingCount = Math.max(0, trip.activeBookingCount - 1);

  // If trip is in "forming" and now empty, kill it
  if (trip.status === "forming" && trip.activeBookingCount === 0) {
    trip.status = "cancelled";
    trip.cancelledAt = new Date();
    trip.cancellationReason = "all_passengers_left";
    trip.cancelledBy = "all_passengers_left";
  }
  // If trip was open_for_drivers and dropped back below threshold, demote
  else if (
    trip.status === "open_for_drivers" &&
    trip.activeBookingCount < trip.minPassengers
  ) {
    trip.status = "forming";
    trip.openedAt = null;
    emit.toAvailableDrivers("trip:removed", { tripId: trip._id });
  }
  // If driver already assigned and all passengers cancel, cancel the trip
  else if (
    ["driver_assigned", "at_pickup"].includes(trip.status) &&
    trip.activeBookingCount === 0
  ) {
    trip.status = "cancelled";
    trip.cancelledAt = new Date();
    trip.cancellationReason = "all_passengers_left";
    trip.cancelledBy = "all_passengers_left";
    if (trip.driver) {
      emit.toDriver(trip.driver, "trip:cancelled", {
        tripId: trip._id,
        reason: "all_passengers_left",
      });
    }
  }

  await trip.save();

  emit.toTripPassengers(trip._id, "trip:booking_count", {
    tripId: trip._id,
    count: trip.activeBookingCount,
    threshold: trip.minPassengers,
    status: trip.status,
  });

  res.status(StatusCodes.OK).json({ msg: "Booking cancelled", booking });
};

// ============================================================
// DRIVER-FACING
// ============================================================

// GET /api/v1/trip/available
// Driver sees trips that:
//  - status = open_for_drivers
//  - dropoff name matches their vehicle's routePreferences[*].to
//  - pickup centroid is within DRIVER_SEARCH_RADIUS_KM of driver
const listAvailableTrips = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId }).populate(
    "vehicle",
  );
  if (!driver) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "No driver profile for this user" });
  }
  if (!driver.vehicle) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "Register and get a vehicle approved before going online." });
  }

  const location = await DriverLocation.findOne({ driver: driver._id });
  if (!location || !location.isOnline || !location.latitude) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "Go online and share your location first." });
  }

  // Route preference set: just the "to" destinations the driver wants.
  const preferredDestinations = new Set(
    (driver.vehicle.routePreferences || []).map((r) => (r.to || "").trim()),
  );

  const candidates = await Trip.find({ status: "open_for_drivers" });

  const enriched = [];
  for (const t of candidates) {
    if (!preferredDestinations.has((t.dropoffLocation.name || "").trim()))
      continue;
    const distKm = distanceKm(
      location.latitude,
      location.longitude,
      t.pickupLocation.latitude,
      t.pickupLocation.longitude,
    );
    if (distKm > rideConfig.DRIVER_SEARCH_RADIUS_KM) continue;
    enriched.push({ trip: publicTripView(t), driverDistanceKm: distKm });
  }

  enriched.sort((a, b) => a.driverDistanceKm - b.driverDistanceKm);

  res.status(StatusCodes.OK).json({ count: enriched.length, trips: enriched });
};

// PATCH /api/v1/trip/:tripId/accept
const acceptTrip = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId }).populate(
    "vehicle",
  );
  if (!driver) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "No driver profile" });
  }
  if (!driver.vehicle) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ msg: "Register and get a vehicle approved before accepting trips." });
  }
  if (driver.activeTrip) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "You already have an active trip. Complete or cancel it first.",
    });
  }

  // Atomic claim: succeed only if the trip is still open_for_drivers.
  const trip = await Trip.findOneAndUpdate(
    { _id: req.params.tripId, status: "open_for_drivers" },
    {
      $set: {
        status: "driver_assigned",
        driver: driver._id,
        vehicle: driver.vehicle._id,
        capacity: driver.vehicle.vehicleCapacity || null,
        acceptedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!trip) {
    return res.status(StatusCodes.CONFLICT).json({
      msg: "Trip already accepted by another driver or no longer available.",
    });
  }

  driver.activeTrip = trip._id;
  await driver.save();

  emit.toTripPassengers(trip._id, "trip:driver_assigned", {
    tripId: trip._id,
    driver: { id: driver._id, vehicleId: driver.vehicle._id },
  });
  emit.toAvailableDrivers("trip:removed", { tripId: trip._id });

  res.status(StatusCodes.OK).json({
    msg: "Trip accepted. Head to pickup.",
    trip: publicTripView(trip),
  });
};

// PATCH /api/v1/trip/:tripId/arrived
// Called by driver (or automatically once GPS shows them within range).
const markArrivedAtPickup = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId });
  if (!driver) return res.status(StatusCodes.FORBIDDEN).json({ msg: "No driver" });

  const trip = await Trip.findOne({
    _id: req.params.tripId,
    driver: driver._id,
    status: "driver_assigned",
  });
  if (!trip) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "Trip not found or not in correct state" });
  }

  trip.status = "at_pickup";
  trip.arrivedAtPickupAt = new Date();
  await trip.save();

  emit.toTripPassengers(trip._id, "trip:driver_arrived", { tripId: trip._id });

  res
    .status(StatusCodes.OK)
    .json({ msg: "Marked arrived at pickup", trip: publicTripView(trip) });
};

// PATCH /api/v1/trip/:tripId/start
const startTrip = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId });
  if (!driver) return res.status(StatusCodes.FORBIDDEN).json({ msg: "No driver" });

  const trip = await Trip.findOne({
    _id: req.params.tripId,
    driver: driver._id,
    status: "at_pickup",
  });
  if (!trip) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Trip must be at_pickup before starting.",
    });
  }

  trip.status = "in_progress";
  trip.startedAt = new Date();
  await trip.save();

  emit.toTripPassengers(trip._id, "trip:started", { tripId: trip._id });

  res.status(StatusCodes.OK).json({ msg: "Trip started", trip: publicTripView(trip) });
};

// PATCH /api/v1/trip/:tripId/complete
const completeTrip = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId });
  if (!driver) return res.status(StatusCodes.FORBIDDEN).json({ msg: "No driver" });

  const trip = await Trip.findOne({
    _id: req.params.tripId,
    driver: driver._id,
    status: "in_progress",
  });
  if (!trip) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Trip is not in progress" });
  }

  // We need the driver's user _id to credit their wallet. Driver profile
  // already loaded above; user is the ref to Passenger collection.
  const driverUserId = driver.user;

  // Settle EACH active booking individually. We pull them first so a
  // partial failure leaves the bookings in a consistent state we can
  // investigate. Each settlement is idempotent enough that re-running
  // for the failed ones is safe (the escrow check prevents double-charge).
  const activeBookings = await Booking.find({
    trip: trip._id,
    status: "active",
  });

  const settlementErrors = [];
  for (const booking of activeBookings) {
    try {
      await settleBookingPayout({
        passengerUserId: booking.passenger,
        driverUserId,
        driverProfileId: driver._id,
        fareAmount: booking.fareAmount,
        driverPay: trip.driverPayPerPassenger,
        platformProfit: trip.platformProfitPerPassenger,
        tripId: trip._id,
        bookingId: booking._id,
      });
      booking.status = "completed";
      booking.completedAt = new Date();
      booking.paymentStatus = "paid";
      await booking.save();
    } catch (err) {
      console.error(
        `completeTrip: settlement failed for booking ${booking._id}`,
        err,
      );
      settlementErrors.push({
        bookingId: booking._id,
        code: err.code || "UNKNOWN",
        message: err.message,
      });
      // Don't break — try the next booking. Operator can manually
      // reconcile the failures from the error array.
    }
  }

  trip.status = "completed";
  trip.completedAt = new Date();
  await trip.save();

  // Free up the driver
  driver.activeTrip = null;
  driver.completedTrips = (driver.completedTrips || 0) + 1;
  await driver.save();

  emit.toTripPassengers(trip._id, "trip:completed", { tripId: trip._id });

  if (settlementErrors.length > 0) {
    // Trip is still marked completed; we return 207-ish info so the driver
    // app can flag this to the operator.
    return res.status(StatusCodes.OK).json({
      msg: "Trip completed, but some settlements failed and need manual reconciliation.",
      trip: publicTripView(trip),
      settlementErrors,
    });
  }

  res
    .status(StatusCodes.OK)
    .json({ msg: "Trip completed", trip: publicTripView(trip) });
};

// PATCH /api/v1/trip/:tripId/cancel
// Driver cancels an accepted trip before pickup.
const cancelTripByDriver = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId });
  if (!driver) return res.status(StatusCodes.FORBIDDEN).json({ msg: "No driver" });

  const trip = await Trip.findOne({
    _id: req.params.tripId,
    driver: driver._id,
    status: { $in: ["driver_assigned", "at_pickup"] },
  });
  if (!trip) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "No cancellable trip" });
  }

  const wasAtPickup = trip.status === "at_pickup";

  // Send the trip back to open_for_drivers so another driver can pick it up
  // (assuming it still has enough passengers).
  trip.driver = null;
  trip.vehicle = null;
  trip.acceptedAt = null;
  trip.arrivedAtPickupAt = null;
  trip.capacity = null;

  if (trip.activeBookingCount >= trip.minPassengers) {
    trip.status = "open_for_drivers";
    trip.openedAt = new Date();
  } else {
    trip.status = "forming";
  }
  await trip.save();

  driver.activeTrip = null;
  driver.cancelledTrips = (driver.cancelledTrips || 0) + 1;
  await driver.save();

  emit.toTripPassengers(trip._id, "trip:driver_cancelled", {
    tripId: trip._id,
    wasAtPickup,
  });

  if (trip.status === "open_for_drivers") {
    await broadcastTripToDrivers(trip);
  }

  res
    .status(StatusCodes.OK)
    .json({ msg: "Trip released back to pool", trip: publicTripView(trip) });
};

// ============================================================
// HELPERS
// ============================================================

// Lean public projection of a Trip — drops internal flags.
function publicTripView(trip) {
  if (!trip) return null;
  const t = trip.toObject ? trip.toObject() : trip;
  return {
    _id: t._id,
    pickupLocation: t.pickupLocation,
    dropoffLocation: t.dropoffLocation,
    status: t.status,
    activeBookingCount: t.activeBookingCount,
    minPassengers: t.minPassengers,
    capacity: t.capacity,
    driver: t.driver || null,
    vehicle: t.vehicle || null,
    farePerPassenger: t.farePerPassenger,
    openedAt: t.openedAt,
    acceptedAt: t.acceptedAt,
    startedAt: t.startedAt,
    completedAt: t.completedAt,
  };
}

// Find online drivers whose vehicle prefers this trip's dropoff and who
// are within the search radius, then push a `trip:new` event to each.
async function broadcastTripToDrivers(trip) {
  // Get all online drivers with fresh locations
  const staleCutoff = new Date(Date.now() - rideConfig.DRIVER_LOCATION_STALE_MS);
  const locations = await DriverLocation.find({
    isOnline: true,
    lastUpdate: { $gte: staleCutoff },
  });
  if (locations.length === 0) return;

  const driverIds = locations.map((l) => l.driver);
  const drivers = await Driver.find({
    _id: { $in: driverIds },
    activeTrip: null,
  }).populate("vehicle");

  const dropoffName = (trip.dropoffLocation.name || "").trim();
  const locByDriver = new Map(locations.map((l) => [String(l.driver), l]));

  for (const driver of drivers) {
    if (!driver.vehicle) continue;
    const prefersRoute = (driver.vehicle.routePreferences || []).some(
      (r) => (r.to || "").trim() === dropoffName,
    );
    if (!prefersRoute) continue;

    const loc = locByDriver.get(String(driver._id));
    if (!loc) continue;
    const distKm = distanceKm(
      loc.latitude,
      loc.longitude,
      trip.pickupLocation.latitude,
      trip.pickupLocation.longitude,
    );
    if (distKm > rideConfig.DRIVER_SEARCH_RADIUS_KM) continue;

    emit.toDriver(driver._id, "trip:new", {
      trip: publicTripView(trip),
      driverDistanceKm: distKm,
    });
  }
}

module.exports = {
  // Passenger
  requestRide,
  getMyActiveBooking,
  cancelBooking,
  // Driver
  listAvailableTrips,
  acceptTrip,
  markArrivedAtPickup,
  startTrip,
  completeTrip,
  cancelTripByDriver,
};
