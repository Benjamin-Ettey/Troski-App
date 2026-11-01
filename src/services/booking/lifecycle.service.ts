import { Types } from "mongoose";
import Booking from "../../models/Booking";
import DriverRun from "../../models/DriverRun";
import { paymentService } from "../payment/payment.service";
import { publish, bookingChannel } from "../realtime/sse";

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

export const completeBooking = async (bookingId: string): Promise<boolean> => {
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: { $in: ["accepted", "arrived", "in_progress"] } },
    [
      {
        $set: {
          status: "completed",
          completedAt: "$$NOW",
          fareFinal: "$fareEstimate",
        },
      },
    ],
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

export const resolveRunBookings = async (
  runId: Types.ObjectId | string,
  opts: { completeInProgress?: boolean } = {},
): Promise<void> => {
  if (opts.completeInProgress) {
    const riding = await Booking.find({
      run: runId,
      status: "in_progress",
    }).select("_id");
    for (const b of riding) await completeBooking(String(b._id));
  }
  const waiting = await Booking.find({
    run: runId,
    status: { $in: ["accepted", "arrived"] },
  }).select("_id");
  for (const b of waiting) await expireBooking(String(b._id));

  const pending = await Booking.find({
    run: runId,
    status: "requested",
  }).select("_id");
  for (const p of pending) {
    const updated = await Booking.findOneAndUpdate(
      { _id: p._id, status: "requested" },
      { $set: { status: "no_drivers", run: null, driver: null } },
    );
    // Anomaly 2.3: Publish SSE event to the passenger for tracking UI updates
    if (updated) {
      publish(bookingChannel(String(p._id)), "booking_declined", {
        reason: "run_ended",
      });
    }
  }
};
