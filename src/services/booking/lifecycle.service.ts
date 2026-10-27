import { Types } from "mongoose";
import Booking from "../../models/Booking";
import DriverRun from "../../models/DriverRun";
import { paymentService } from "../payment/payment.service";
import { publish, bookingChannel } from "../realtime/sse";

/**
 * Shared booking lifecycle logic used by manual status changes, the geofence
 * auto-complete, and run-end resolution. All completion/expiry flows go through
 * here so seat return, payment settlement, and SSE events stay consistent and
 * idempotent.
 */

/** Return a booking's reserved seat(s) to its run, capped at the vehicle total. */
export const returnSeatToRun = async (
  runId: Types.ObjectId | string,
  seats: number,
): Promise<void> => {
  if (!runId || !seats) return;
  await DriverRun.updateOne({ _id: runId }, [
    {
      $set: {
        availableSeats: {
          $min: ["$totalSeats", { $add: ["$availableSeats", seats] }],
        },
      },
    },
  ]);
};

/**
 * Complete a booking: settle the fare to the driver, free the seat, notify the
 * passenger. Atomic + idempotent — only one caller ever completes a given
 * booking (whoever flips it out of an on-trip status wins).
 */
export const completeBooking = async (bookingId: string): Promise<boolean> => {
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: { $in: ["accepted", "arrived", "in_progress"] } },
    [{ $set: { status: "completed", completedAt: "$$NOW", fareFinal: "$fareEstimate" } }],
    { new: true },
  );
  if (!booking) return false;

  if (booking.run) {
    await returnSeatToRun(booking.run, booking.seatsRequested as number);
  }
  await paymentService.releaseEscrowForBooking(String(booking._id));

  publish(bookingChannel(String(booking._id)), "trip_completed", {
    bookingId: booking._id,
    fare: booking.fareFinal,
  });
  return true;
};

/**
 * Expire a booking that never actually started (passenger matched but never
 * boarded, e.g. the run ended first): free the seat and refund the passenger.
 */
export const expireBooking = async (bookingId: string): Promise<boolean> => {
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: { $in: ["accepted", "arrived"] } },
    { $set: { status: "expired" } },
    { new: true },
  );
  if (!booking) return false;

  if (booking.run) {
    await returnSeatToRun(booking.run, booking.seatsRequested as number);
  }
  await paymentService.refundForBooking(String(booking._id));

  publish(bookingChannel(String(booking._id)), "trip_expired", {
    bookingId: booking._id,
  });
  return true;
};

/**
 * Resolve the bookings attached to a run that is ending.
 * - `completeInProgress: true` (explicit end): passengers mid-trip are completed
 *   (paid out). Used when the driver ends their run normally.
 * - `completeInProgress: false` (ghost/stale end): we do NOT auto-pay for an
 *   ambiguous trip; in-progress bookings are left for the geofence/admin, and
 *   only never-boarded bookings are expired + refunded.
 */
export const resolveRunBookings = async (
  runId: Types.ObjectId | string,
  opts: { completeInProgress?: boolean } = {},
): Promise<void> => {
  if (opts.completeInProgress) {
    const riding = await Booking.find({ run: runId, status: "in_progress" }).select("_id");
    for (const b of riding) await completeBooking(String(b._id));
  }
  const waiting = await Booking.find({
    run: runId,
    status: { $in: ["accepted", "arrived"] },
  }).select("_id");
  for (const b of waiting) await expireBooking(String(b._id));
};
