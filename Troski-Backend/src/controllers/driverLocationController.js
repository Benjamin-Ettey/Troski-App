// Driver session lifecycle:
//   - goOnline: start a Trip with a destination → driver appears on map.
//   - updateLocation: push live GPS (HTTP fallback; sockets preferred).
//   - addWalkOn / removeWalkOn: track cash passengers picked up off the
//     street so the system knows true remaining seats.
//   - goOffline: end the session. Refuses if onboarded passengers are
//     still on the vehicle (driver must end-trip properly first).

const { StatusCodes } = require("http-status-codes");
const Driver = require("../models/drivers");
const DriverLocation = require("../models/driverLocations");
const Trip = require("../models/trips");
const Booking = require("../models/bookings");
const { isInGhana } = require("../utils/geo");
const { computeFare } = require("../utils/fareService");
const { refundEscrow } = require("../utils/walletService");
const { emit } = require("../socket/emit");

// ============================================================
// GO ONLINE — creates an active Trip with the driver's destination.
// Body: { latitude, longitude, destination: { latitude, longitude, name } }
// ============================================================
const goOnline = async (req, res) => {
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
      .json({ msg: "Register a vehicle before going online." });
  }
  if (driver.vehicle.vehicleStatus !== "approved") {
    return res.status(StatusCodes.FORBIDDEN).json({
      msg: `Your vehicle is ${driver.vehicle.vehicleStatus}. Wait for admin approval before going online.`,
    });
  }
  if (driver.activeTrip) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "You're already on an active trip. End it before starting a new one.",
      tripId: driver.activeTrip,
    });
  }

  const { latitude, longitude, destination } = req.body || {};
  if (!isInGhana(latitude, longitude)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Valid current location coordinates are required" });
  }
  if (
    !destination ||
    !destination.name ||
    !isInGhana(destination.latitude, destination.longitude)
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Destination with name + coordinates is required",
    });
  }

  // Snapshot the fare ONCE at trip creation. All passengers who join this
  // trip pay this same fare, regardless of where on the route they board.
  const fare = computeFare({
    pickup: { latitude, longitude },
    dropoff: {
      latitude: destination.latitude,
      longitude: destination.longitude,
    },
  });
  if (!fare) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Could not determine fare for this route. Verify your coordinates.",
    });
  }

  const trip = await Trip.create({
    driver: driver._id,
    vehicle: driver.vehicle._id,
    dropoffLocation: {
      latitude: destination.latitude,
      longitude: destination.longitude,
      name: destination.name,
    },
    pickupZone: fare.pickupZone,
    dropoffZone: fare.dropoffZone,
    farePerPassenger: fare.fare,
    driverPayPerPassenger: fare.driverPay,
    platformProfitPerPassenger: fare.platformProfit,
    capacity: driver.vehicle.vehicleCapacity || 14,
    activeBookingCount: 0,
    walkOnCount: 0,
    status: "open",
  });

  driver.activeTrip = trip._id;
  await driver.save();

  const location = await DriverLocation.findOneAndUpdate(
    { driver: driver._id },
    {
      $set: {
        latitude,
        longitude,
        isOnline: true,
        destination: {
          name: destination.name,
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
        activeTrip: trip._id,
        lastUpdate: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  res.status(StatusCodes.OK).json({
    msg: "Online. Passengers can see you now.",
    trip,
    fare: {
      fare: fare.fare,
      driverPay: fare.driverPay,
      platformProfit: fare.platformProfit,
      breakdown: fare.breakdown,
    },
    location,
  });
};

// ============================================================
// GO OFFLINE — ends the driver session.
// If there's an active Trip with passengers already onboard, REFUSE
// (driver must press "End trip" first so settlements happen).
// If only pending/accepted bookings exist, refund them and cancel.
// ============================================================
const goOffline = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId });
  if (!driver) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: "No driver" });
  }

  if (driver.activeTrip) {
    const trip = await Trip.findById(driver.activeTrip);
    if (trip) {
      const onboardCount = await Booking.countDocuments({
        trip: trip._id,
        status: "onboard",
      });
      if (onboardCount > 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: "You have onboarded passengers. End the trip properly to settle their fares before going offline.",
          tripId: trip._id,
          onboardCount,
        });
      }

      // Refund any escrow-held bookings (pending/accepted that never boarded)
      const heldBookings = await Booking.find({
        trip: trip._id,
        status: { $in: ["pending", "accepted"] },
      });
      for (const b of heldBookings) {
        if (b.paymentStatus === "held" && b.fareAmount > 0) {
          try {
            await refundEscrow({
              userId: b.passenger,
              amount: b.fareAmount,
              description: `Refund — driver went offline (trip ${trip._id})`,
              tripId: trip._id,
              bookingId: b._id,
            });
            b.paymentStatus = "refunded";
          } catch (err) {
            console.error("goOffline refund failed", err);
          }
        }
        b.status = "cancelled";
        b.cancelledAt = new Date();
        b.cancellationReason = "driver went offline";
        await b.save();

        emit.toTripPassengers(trip._id, "booking:cancelled", {
          bookingId: b._id,
          reason: "driver went offline",
        });
      }

      trip.status = "cancelled";
      trip.cancelledAt = new Date();
      trip.cancellationReason = "driver went offline";
      await trip.save();
    }

    driver.activeTrip = null;
    await driver.save();
  }

  await DriverLocation.findOneAndUpdate(
    { driver: driver._id },
    {
      $set: {
        isOnline: false,
        socketId: null,
        destination: null,
        activeTrip: null,
        lastUpdate: new Date(),
      },
    },
  );

  res.status(StatusCodes.OK).json({ msg: "Offline" });
};

// ============================================================
// LOCATION UPDATE (HTTP fallback; sockets preferred for high-frequency)
// ============================================================
const updateLocation = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId });
  if (!driver) {
    return res.status(StatusCodes.FORBIDDEN).json({ msg: "No driver" });
  }

  const { latitude, longitude, heading, speed } = req.body || {};
  if (!isInGhana(latitude, longitude)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Valid location coordinates are required" });
  }

  const location = await DriverLocation.findOneAndUpdate(
    { driver: driver._id, isOnline: true },
    {
      $set: {
        latitude,
        longitude,
        heading: heading ?? null,
        speed: speed ?? null,
        lastUpdate: new Date(),
      },
    },
    { new: true },
  );

  if (!location) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Go online before pushing location updates" });
  }

  // If on a trip, also push the location into the trip room so passengers
  // see the driver moving in real time.
  if (driver.activeTrip) {
    emit.toTripPassengers(driver.activeTrip, "driver:location", {
      tripId: driver.activeTrip,
      latitude,
      longitude,
      heading: heading ?? null,
      speed: speed ?? null,
    });
  }

  res.status(StatusCodes.OK).json({ msg: "Location updated", location });
};

// ============================================================
// WALK-ON COUNTER — driver tracks cash passengers boarded off-app.
// ============================================================
const addWalkOn = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId });
  if (!driver || !driver.activeTrip) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "No active trip" });
  }

  const trip = await Trip.findById(driver.activeTrip);
  if (!trip) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Trip not found" });
  }

  const remaining =
    (trip.capacity || 0) - trip.activeBookingCount - trip.walkOnCount;
  if (remaining <= 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      msg: "Vehicle is full — no seats remaining",
      capacity: trip.capacity,
      appBookings: trip.activeBookingCount,
      walkOns: trip.walkOnCount,
    });
  }

  trip.walkOnCount += 1;
  await trip.save();

  const seatsInfo = {
    tripId: trip._id,
    capacity: trip.capacity,
    appBookings: trip.activeBookingCount,
    walkOns: trip.walkOnCount,
    remainingSeats:
      (trip.capacity || 0) - trip.activeBookingCount - trip.walkOnCount,
  };
  emit.toTripPassengers(trip._id, "trip:seats_updated", seatsInfo);

  res
    .status(StatusCodes.OK)
    .json({ msg: "Walk-on passenger added", ...seatsInfo });
};

const removeWalkOn = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.passengerId });
  if (!driver || !driver.activeTrip) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "No active trip" });
  }

  const trip = await Trip.findById(driver.activeTrip);
  if (!trip) {
    return res.status(StatusCodes.NOT_FOUND).json({ msg: "Trip not found" });
  }
  if (trip.walkOnCount <= 0) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "No walk-on passengers to remove" });
  }

  trip.walkOnCount -= 1;
  await trip.save();

  const seatsInfo = {
    tripId: trip._id,
    capacity: trip.capacity,
    appBookings: trip.activeBookingCount,
    walkOns: trip.walkOnCount,
    remainingSeats:
      (trip.capacity || 0) - trip.activeBookingCount - trip.walkOnCount,
  };
  emit.toTripPassengers(trip._id, "trip:seats_updated", seatsInfo);

  res
    .status(StatusCodes.OK)
    .json({ msg: "Walk-on passenger removed", ...seatsInfo });
};

module.exports = {
  goOnline,
  goOffline,
  updateLocation,
  addWalkOn,
  removeWalkOn,
};
