// Auto-end engine.
//
// Called on every driver location push (HTTP + socket). For each `onboard`
// booking on the driver's active trip, checks distance to that passenger's
// drop-off and — if within ARRIVED_AT_DROPOFF_THRESHOLD_METERS — settles
// the booking automatically. When all bookings are arrived/done AND the
// driver is near their final destination, marks the Trip completed.
//
// Each booking has its own drop-off; settlements fire independently. A
// passenger getting off enroute settles their fare; the driver keeps
// going for the others.

const Trip = require("../models/trips");
const Booking = require("../models/bookings");
const Driver = require("../models/drivers");
const DriverLocation = require("../models/driverLocations");
const rideConfig = require("../config/rideConfig");
const { distanceMeters } = require("./geo");
const { settleBookingPayout } = require("./walletService");
const { emit } = require("../socket/emit");

/**
 * @param {ObjectId} driverProfileId — the Driver._id (not user._id)
 * @param {{latitude:number, longitude:number}} currentLocation
 */
async function checkAutoEnd(driverProfileId, currentLocation) {
  if (!driverProfileId || !currentLocation) return;

  const driver = await Driver.findById(driverProfileId);
  if (!driver || !driver.activeTrip) return;

  const trip = await Trip.findById(driver.activeTrip);
  if (!trip || !["in_progress", "open"].includes(trip.status)) return;

  // Settle any onboard bookings whose passenger has arrived.
  const onboardBookings = await Booking.find({
    trip: trip._id,
    status: "onboard",
  });

  for (const booking of onboardBookings) {
    if (
      !booking.dropoffLocation ||
      booking.dropoffLocation.latitude == null ||
      booking.dropoffLocation.longitude == null
    ) {
      continue;
    }
    const distM = distanceMeters(
      currentLocation.latitude,
      currentLocation.longitude,
      booking.dropoffLocation.latitude,
      booking.dropoffLocation.longitude,
    );
    if (distM > rideConfig.ARRIVED_AT_DROPOFF_THRESHOLD_METERS) continue;

    // ── In range — settle this passenger ──
    try {
      // For wallet-paid bookings, the passenger's escrowBalance is drained
      // into the driver. For paystack-paid bookings, the passenger has
      // already paid externally; settle just credits the driver and
      // records the platform commission. Pass paymentMethod through.
      const paymentMethod = booking.paymentMethod || "wallet";
      const driverPay =
        booking.driverPayAmount != null
          ? booking.driverPayAmount
          : (booking.fareAmount || 0) * 0.9; // crude fallback
      const platformProfit =
        booking.platformProfitAmount != null
          ? booking.platformProfitAmount
          : (booking.fareAmount || 0) - driverPay;

      await settleBookingPayoutAware({
        paymentMethod,
        passengerUserId: booking.passenger,
        driverUserId: driver.user,
        driverProfileId: driver._id,
        fareAmount: booking.fareAmount,
        driverPay,
        platformProfit,
        tripId: trip._id,
        bookingId: booking._id,
      });

      booking.status = "arrived";
      booking.arrivedAt = new Date();
      booking.paymentStatus = "paid";
      await booking.save();

      // Free the seat for any future joiners (rare since they're at dropoff)
      await Trip.findByIdAndUpdate(trip._id, {
        $inc: { activeBookingCount: -1 },
      });
      driver.completedTrips = (driver.completedTrips || 0) + 1;
      driver.totalEarnings = (driver.totalEarnings || 0) + driverPay;
      await driver.save();

      emit.toUser(booking.passenger, "booking:arrived", {
        bookingId: booking._id,
        message: "You've arrived at your drop-off. Fare settled.",
      });
      emit.toDriver(driver._id, "booking:settled", {
        bookingId: booking._id,
        driverPay,
      });
    } catch (err) {
      console.error("Auto-end settle failed for booking", booking._id, err);
      // Continue with the others; operator can manually reconcile.
    }
  }

  // ── Trip-level completion ──
  // If no bookings are still in transit (pending / accepted / onboard)
  // AND the driver is near the trip's final destination, mark the trip
  // completed and free the driver.
  const stillActive = await Booking.countDocuments({
    trip: trip._id,
    status: { $in: ["awaiting_payment", "pending", "accepted", "onboard"] },
  });
  if (stillActive === 0) {
    const distToFinal = distanceMeters(
      currentLocation.latitude,
      currentLocation.longitude,
      trip.dropoffLocation.latitude,
      trip.dropoffLocation.longitude,
    );
    if (distToFinal <= rideConfig.ARRIVED_AT_DROPOFF_THRESHOLD_METERS * 3) {
      // Slightly more lenient for the trip-level close — being within ~90m
      // of the named destination is "done."
      trip.status = "completed";
      trip.completedAt = new Date();
      await trip.save();

      driver.activeTrip = null;
      await driver.save();

      await DriverLocation.findOneAndUpdate(
        { driver: driver._id },
        { $set: { activeTrip: null, destination: null } },
      );

      emit.toDriver(driver._id, "trip:completed", { tripId: trip._id });
    }
  }
}

// Thin wrapper to pass paymentMethod through to settleBookingPayout.
// settleBookingPayout currently always assumes wallet escrow; for paystack
// bookings the passenger's wallet isn't involved (money's in our Paystack
// account), so we credit the driver directly. We do that here without
// touching the existing wallet-path implementation.
async function settleBookingPayoutAware(args) {
  if (args.paymentMethod === "wallet") {
    return settleBookingPayout(args);
  }
  // Paystack path: no passenger-side movement. Credit driver wallet only,
  // record platform commission.
  const { creditWallet } = require("./walletService");
  await creditWallet({
    userId: args.driverUserId,
    amount: args.driverPay,
    description: `Trip payout (paystack-paid)`,
    tripId: args.tripId,
    bookingId: args.bookingId,
  });
  if (args.platformProfit > 0) {
    const Transaction = require("../models/Transaction");
    await Transaction.create({
      trip: args.tripId,
      booking: args.bookingId,
      passenger: args.passengerUserId,
      driver: args.driverProfileId,
      amount: args.platformProfit,
      type: "platform_fee",
      status: "completed",
    });
  }
  // Also flip the Payment row to completed
  const Payment = require("../models/payments");
  await Payment.findOneAndUpdate(
    { booking: args.bookingId, paymentType: "ride_payment" },
    { $set: { status: "completed", escrowReleased: true, paidAt: new Date() } },
  );
}

module.exports = { checkAutoEnd };
