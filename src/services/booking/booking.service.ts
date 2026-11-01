import { StatusCodes } from "http-status-codes";
import mongoose, { Types } from "mongoose";
import Booking from "../../models/Booking";
import DriverProfile from "../../models/DriverProfile";
import DriverRun from "../../models/DriverRun";
import { ServiceResponse } from "../auth/local/auth.service";
import { haversineKm, nearestTown } from "../../utils/locationLookup";
import { calculateRouteFare } from "../fare/fare.service";
import { mapsService } from "../maps/maps.service";
import { paymentService } from "../payment/payment.service";
import { completeBooking, returnSeatToRun } from "./lifecycle.service";
import { publish, bookingChannel } from "../realtime/sse";
import zonesConfig from "../../data/zonesConfig";
import type {
  BookingStatus,
  CancelledBy,
  LocationPoint,
} from "../../types/booking.types";

const REQUEST_EXPIRY_MINUTES = 15;

const DRIVER_TRANSITIONS: Record<string, BookingStatus[]> = {
  accepted: ["arrived"],
  arrived: ["in_progress"],
  in_progress: ["completed"],
};

const STATUS_TIMESTAMP: Record<string, string> = {
  arrived: "arrivedAt",
  in_progress: "startedAt",
  completed: "completedAt",
};

export const canAccessRideDetails = (booking: any): boolean => {
  return (
    booking.paymentMethod === "cash" || booking.paymentStatus === "escrow_held"
  );
};

export const maskSensitiveBooking = (
  booking: any,
  role: string,
  userId: string,
) => {
  const isPassenger =
    String(booking.passenger?._id || booking.passenger) === String(userId);
  if (!isPassenger || role !== "passenger") return booking;
  if (canAccessRideDetails(booking)) return booking;

  const masked = booking.toObject ? booking.toObject() : { ...booking };
  delete masked.driver;
  delete masked.vehicle;
  delete masked.run;
  if (masked.pickupPoint) {
    delete masked.pickupPoint.latitude;
    delete masked.pickupPoint.longitude;
  }
  return masked;
};

const requestExpiryCutoff = (): Date =>
  new Date(Date.now() - REQUEST_EXPIRY_MINUTES * 60 * 1000);

export const expireStaleRequests = async (): Promise<void> => {
  const cutoff = requestExpiryCutoff();
  const expired = await Booking.find({
    status: "requested",
    createdAt: { $lt: cutoff },
  }).select("_id");

  for (const b of expired) {
    const updated = await Booking.findOneAndUpdate(
      { _id: b._id, status: "requested" },
      { $set: { status: "expired" } },
    );
    if (updated) {
      publish(bookingChannel(String(b._id)), "booking_expired", {});
    }
  }
};

export const estimateFareService = async (
  pickupLatitude: number,
  pickupLongitude: number,
  dropoffLatitude: number,
  dropoffLongitude: number,
  seats: number,
): Promise<ServiceResponse> => {
  const pickupTown = nearestTown(pickupLatitude, pickupLongitude);
  const dropoffTown = nearestTown(dropoffLatitude, dropoffLongitude);

  if (!pickupTown) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message:
        "Could not determine a supported pickup location from the provided coordinates.",
    };
  }
  if (!dropoffTown) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message:
        "Could not determine a supported destination location from the provided coordinates.",
    };
  }
  if (pickupTown.town === dropoffTown.town) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Pickup and destination cannot be the same.",
    };
  }

  // Use straight-line distance matching the old calculateDistance implementation
  const distanceInKm = haversineKm(
    pickupLatitude,
    pickupLongitude,
    dropoffLatitude,
    dropoffLongitude,
  );

  const fare = calculateRouteFare({
    pickupZone: pickupTown.zoneId,
    dropoffZone: dropoffTown.zoneId,
    distanceInKm,
    zonesConfig,
    seats
  });

  return {
    status: StatusCodes.OK,
    message: "Fare estimated successfully",
    data: {
      pickupTown: pickupTown.town,
      dropoffTown: dropoffTown.town,
      seats,
      distanceKm: fare.distanceInKm,
      distanceSource: "straight-line",
      fare,
    },
  };
};

export const acceptBookingService = async (
  driverUserId: Types.ObjectId,
  bookingId: string,
): Promise<ServiceResponse> => {
  const profile = await DriverProfile.findOne({ user: driverUserId });
  if (!profile)
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };

  profile.lastSeenAt = new Date();
  await profile.save();

  const session = await mongoose.startSession();
  session.startTransaction();

  let booking, reservedRun;
  try {
    booking = await Booking.findOneAndUpdate(
      { _id: bookingId, status: "requested", driver: profile._id },
      { $set: { status: "accepted", acceptedAt: new Date() } },
      { session, new: true },
    );

    if (!booking) {
      throw new Error("Offer expired, not found, or already processed");
    }

    reservedRun = await DriverRun.findOneAndUpdate(
      {
        _id: booking.run,
        status: "active",
        availableSeats: { $gte: booking.seatsRequested },
      },
      { $inc: { availableSeats: -(booking.seatsRequested as number) } },
      { session, new: true },
    );

    if (!reservedRun) {
      await session.abortTransaction();
      session.endSession();

      // Perform atomic update outside the transaction
      await Booking.updateOne(
        { _id: bookingId, status: "requested" },
        { $set: { status: "no_drivers", driver: null, run: null } },
      );

      return {
        status: StatusCodes.CONFLICT,
        message: "Vehicle no longer has enough seats for this request.",
      };
    }

    await session.commitTransaction();
  } catch (error: any) {
    await session.abortTransaction();
    return { status: StatusCodes.CONFLICT, message: error.message };
  } finally {
    // FIX: Unconditionally close the session to avoid leaks after abort/commit
    session.endSession();
  }

  await booking.populate("passenger", "name phoneNumber profileImage");
  publish(bookingChannel(bookingId), "booking_accepted", {
    bookingId: booking._id,
  });

  return {
    status: StatusCodes.OK,
    message: "Ride accepted. Head to the pickup point.",
    data: { booking, seatsRemaining: reservedRun.availableSeats },
  };
};

export const declineBookingService = async (
  driverUserId: Types.ObjectId,
  bookingId: string,
): Promise<ServiceResponse> => {
  const profile = await DriverProfile.findOne({ user: driverUserId });
  if (!profile)
    return { status: StatusCodes.NOT_FOUND, message: "Driver not found" };

  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: "requested", driver: profile._id },
    { $set: { status: "no_drivers", driver: null, run: null } },
  );

  if (!booking)
    return {
      status: StatusCodes.CONFLICT,
      message: "Offer expired, changed, or not assigned to you.",
    };

  publish(bookingChannel(bookingId), "booking_declined", {});
  return { status: StatusCodes.OK, message: "Booking declined" };
};

export const updateBookingStatusService = async (
  driverUserId: Types.ObjectId,
  bookingId: string,
  nextStatus: BookingStatus,
): Promise<ServiceResponse> => {
  const profile = await DriverProfile.findOne({ user: driverUserId });
  if (!profile)
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };

  profile.lastSeenAt = new Date();
  await profile.save();

  const booking = await Booking.findById(bookingId);
  if (!booking)
    return { status: StatusCodes.NOT_FOUND, message: "Booking not found" };

  if (String(booking.driver) !== String(profile._id)) {
    return {
      status: StatusCodes.FORBIDDEN,
      message: "You are not assigned to this booking",
    };
  }

  const allowed = DRIVER_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(nextStatus)) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: `Cannot change status from '${booking.status}' to '${nextStatus}'`,
    };
  }

  if (nextStatus === "completed") {
    await completeBooking(bookingId);
    const completed = await Booking.findById(bookingId);
    return {
      status: StatusCodes.OK,
      message: "Booking marked as completed",
      data: { booking: completed },
    };
  }

  booking.status = nextStatus;
  const timestampField = STATUS_TIMESTAMP[nextStatus];
  if (timestampField) (booking as any)[timestampField] = new Date();
  await booking.save();

  publish(
    bookingChannel(bookingId),
    nextStatus === "arrived" ? "driver_arrived" : "trip_started",
    { status: nextStatus },
  );

  return {
    status: StatusCodes.OK,
    message: `Booking marked as ${nextStatus}`,
    data: { booking },
  };
};

export const cancelBookingService = async (
  userId: Types.ObjectId,
  role: CancelledBy,
  bookingId: string,
  reason?: string,
): Promise<ServiceResponse> => {
  const booking = await Booking.findById(bookingId);
  if (!booking)
    return { status: StatusCodes.NOT_FOUND, message: "Booking not found" };

  let isParticipant = false;
  if (role === "passenger") {
    isParticipant = String(booking.passenger) === String(userId);
  } else if (role === "driver") {
    const profile = await DriverProfile.findOne({ user: userId });
    isParticipant = !!profile && String(booking.driver) === String(profile._id);
  }

  if (!isParticipant)
    return {
      status: StatusCodes.FORBIDDEN,
      message: "You are not allowed to cancel this booking",
    };

  const cancellable: BookingStatus[] = ["requested", "accepted", "arrived"];
  if (!cancellable.includes(booking.status as BookingStatus)) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: `A booking that is '${booking.status}' cannot be cancelled`,
    };
  }

  const seatsWereReserved =
    booking.status === "accepted" || booking.status === "arrived";
  const penaltyApplies = booking.status === "arrived" && role === "passenger";

  booking.status = "cancelled";
  booking.cancellation = { by: role, reason, at: new Date() };
  await booking.save();

  if (seatsWereReserved && booking.run) {
    await returnSeatToRun(booking.run, booking.seatsRequested as number);
  }

  try {
    if (penaltyApplies) {
      await paymentService.applyCancellationPenalty(String(booking._id));
    } else {
      await paymentService.refundForBooking(String(booking._id));
    }
  } catch (error) {
    console.error(
      `[PAYMENT FAILURE] Failed to process refund/penalty for cancellation of booking ${booking._id}. Requires reconciliation.`,
      error,
    );
  }

  const refreshed = await Booking.findById(booking._id);

  return {
    status: StatusCodes.OK,
    message: penaltyApplies
      ? "Booking cancelled. Cancellation fee applied."
      : "Booking cancelled",
    data: { booking: refreshed ?? booking },
  };
};

export const getMyBookingsService = async (
  userId: Types.ObjectId,
  role: "passenger" | "driver",
  query: { status?: string; page?: number; limit?: number },
): Promise<ServiceResponse> => {
  const filter: Record<string, unknown> = {};

  if (role === "driver") {
    const profile = await DriverProfile.findOne({ user: userId });
    if (!profile)
      return {
        status: StatusCodes.NOT_FOUND,
        message: "Driver profile not found",
      };
    filter.driver = profile._id;
  } else {
    filter.passenger = userId;
  }
  if (query.status) filter.status = query.status;

  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 10));
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("passenger", "name phoneNumber profileImage")
      .populate({
        path: "driver",
        select: "user isOnline",
        populate: { path: "user", select: "name phoneNumber profileImage" },
      })
      .populate("vehicle")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  const maskedBookings = bookings.map((b) =>
    maskSensitiveBooking(b, role, String(userId)),
  );

  return {
    status: StatusCodes.OK,
    message: "Bookings retrieved",
    data: {
      bookings: maskedBookings,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
  };
};

export const getBookingByIdService = async (
  userId: Types.ObjectId,
  role: string,
  bookingId: string,
): Promise<ServiceResponse> => {
  const booking = await Booking.findById(bookingId)
    .populate("passenger", "name phoneNumber profileImage")
    .populate({
      path: "driver",
      select: "user isOnline",
      populate: { path: "user", select: "name phoneNumber profileImage" },
    })
    .populate("vehicle");

  if (!booking)
    return { status: StatusCodes.NOT_FOUND, message: "Booking not found" };

  const isPassenger =
    String(booking.passenger?._id ?? booking.passenger) === String(userId);
  let isDriver = false;
  if (role === "driver") {
    const profile = await DriverProfile.findOne({ user: userId });
    isDriver =
      !!profile &&
      String((booking.driver as any)?._id ?? booking.driver) ===
        String(profile._id);
  }

  if (!isPassenger && !isDriver && role !== "admin") {
    return {
      status: StatusCodes.FORBIDDEN,
      message: "You are not allowed to view this booking",
    };
  }

  return {
    status: StatusCodes.OK,
    message: "Booking retrieved",
    data: { booking: maskSensitiveBooking(booking, role, String(userId)) },
  };
};

export const getBookingRideDetailsService = async (
  userId: Types.ObjectId,
  bookingId: string,
): Promise<ServiceResponse> => {
  const booking = await Booking.findById(bookingId)
    .populate({
      path: "driver",
      select: "user vehicle",
      populate: { path: "user", select: "name phoneNumber profileImage" },
    })
    .populate("vehicle");

  if (!booking)
    return { status: StatusCodes.NOT_FOUND, message: "Booking not found" };

  if (String(booking.passenger) !== String(userId)) {
    return { status: StatusCodes.FORBIDDEN, message: "Unauthorized" };
  }

  if (!canAccessRideDetails(booking)) {
    return {
      status: StatusCodes.PAYMENT_REQUIRED,
      message: "Complete payment to unlock ride details.",
    };
  }

  return {
    status: StatusCodes.OK,
    message: "Ride details unlocked",
    data: { booking },
  };
};
