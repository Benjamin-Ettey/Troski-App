import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import Booking from "../../models/Booking";
import DriverProfile from "../../models/DriverProfile";
import Vehicle from "../../models/Vehicle";
import { ServiceResponse } from "../auth/local/auth.service";
import { resolveTown, haversineKm } from "../../utils/locationLookup";
import { calculateRouteFare } from "../fare/fare.service";
import { mapsService } from "../maps/maps.service";
import { paymentService } from "../payment/payment.service";
import zonesConfig from "../../data/zonesConfig";
import type {
  BookingStatus,
  CancelledBy,
  LocationPoint,
  PaymentMethod,
} from "../../types/booking.types";

// A request that no driver accepts within this window is treated as expired.
const REQUEST_EXPIRY_MINUTES = 15;

// A driver marked online but inactive for longer than this is considered offline
// (e.g. they closed the app without toggling off). See markStaleDriversOffline.
const STALE_ONLINE_MINUTES = 5;

// Statuses that mean a passenger/driver is already tied to a live trip.
const ACTIVE_STATUSES: BookingStatus[] = [
  "requested",
  "accepted",
  "arrived",
  "in_progress",
];

// Allowed driver-driven transitions after a booking is accepted.
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

const requestExpiryCutoff = (): Date =>
  new Date(Date.now() - REQUEST_EXPIRY_MINUTES * 60 * 1000);

/**
 * Flip any driver who is marked online but hasn't been seen within
 * STALE_ONLINE_MINUTES back to offline. Runs lazily whenever a driver polls
 * for requests, so the collection self-heals without a background job.
 * (A scheduled cron would be more thorough at scale.)
 */
const markStaleDriversOffline = async (): Promise<void> => {
  const cutoff = new Date(Date.now() - STALE_ONLINE_MINUTES * 60 * 1000);
  await DriverProfile.updateMany(
    {
      isOnline: true,
      $or: [{ lastSeenAt: { $lt: cutoff } }, { lastSeenAt: { $exists: false } }],
    },
    { $set: { isOnline: false } },
  );
};

/**
 * Compute the trip distance and run it through the shared fare algorithm
 * (calculateRouteFare). The fare service prices a single seat; the trip total
 * scales that by the number of seats requested.
 *
 * Distance/ETA come from Google (road distance). If Google is unconfigured or
 * unavailable, we fall back to straight-line (haversine) distance so the quote
 * still succeeds — degraded but functional.
 */
const quoteFare = async (
  pickup: LocationPoint,
  destination: LocationPoint,
  seats: number,
) => {
  let distanceInKm: number;
  let etaMinutes: number | null = null;
  let distanceSource: "google" | "straight-line" = "google";

  try {
    const road = await mapsService.getRoadDistance(
      { lat: pickup.latitude, lng: pickup.longitude },
      { lat: destination.latitude, lng: destination.longitude },
    );
    distanceInKm = road.distanceKm;
    etaMinutes = road.durationMin;
  } catch {
    distanceInKm = haversineKm(
      pickup.latitude,
      pickup.longitude,
      destination.latitude,
      destination.longitude,
    );
    distanceSource = "straight-line";
  }

  const fare = calculateRouteFare({
    pickupZone: pickup.zoneId,
    dropoffZone: destination.zoneId,
    distanceInKm,
    zonesConfig,
  });

  const total = parseFloat((fare.finalFare * seats).toFixed(2));

  return {
    fare,
    distanceKm: fare.distanceInKm,
    total,
    seats,
    etaMinutes,
    distanceSource,
  };
};

/**
 * Compute a fare preview for a pickup/destination pair without persisting
 * anything. Used by passengers before they commit to a booking.
 */
export const estimateFareService = async (
  pickupTown: string,
  destinationTown: string,
  seats: number,
): Promise<ServiceResponse> => {
  const pickup = resolveTown(pickupTown);
  const destination = resolveTown(destinationTown);

  if (!pickup) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: `Unsupported pickup location: '${pickupTown}'`,
    };
  }
  if (!destination) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: `Unsupported destination location: '${destinationTown}'`,
    };
  }
  if (pickup.town === destination.town) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Pickup and destination cannot be the same",
    };
  }

  const quote = await quoteFare(pickup, destination, seats);

  return {
    status: StatusCodes.OK,
    message: "Fare estimated successfully",
    data: {
      pickup,
      destination,
      seats,
      distanceKm: quote.distanceKm,
      etaMinutes: quote.etaMinutes,
      distanceSource: quote.distanceSource,
      total: quote.total,
      fare: quote.fare,
    },
  };
};

/**
 * Create a new ride request for a passenger.
 */
export const createBookingService = async (
  passengerId: Types.ObjectId,
  payload: {
    pickupTown: string;
    destinationTown: string;
    seats: number;
    paymentMethod: PaymentMethod;
  },
): Promise<ServiceResponse> => {
  const pickup = resolveTown(payload.pickupTown);
  const destination = resolveTown(payload.destinationTown);

  if (!pickup) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: `Unsupported pickup location: '${payload.pickupTown}'`,
    };
  }
  if (!destination) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: `Unsupported destination location: '${payload.destinationTown}'`,
    };
  }
  if (pickup.town === destination.town) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: "Pickup and destination cannot be the same",
    };
  }

  // A passenger may only have one live request/trip at a time.
  const existing = await Booking.findOne({
    passenger: passengerId,
    status: { $in: ACTIVE_STATUSES },
  });
  if (existing) {
    return {
      status: StatusCodes.CONFLICT,
      message: "You already have an active booking. Complete or cancel it first.",
      data: { bookingId: existing._id, status: existing.status },
    };
  }

  const quote = await quoteFare(pickup, destination, payload.seats);

  const booking = await Booking.create({
    passenger: passengerId,
    pickup,
    destination,
    distanceKm: quote.distanceKm,
    seatsRequested: payload.seats,
    fareEstimate: quote.total,
    paymentMethod: payload.paymentMethod,
  });

  return {
    status: StatusCodes.CREATED,
    message: "Ride requested successfully. Searching for a driver...",
    data: { booking, fare: quote.fare, etaMinutes: quote.etaMinutes },
  };
};

/**
 * List open ride requests that match a driver's served routes.
 * Matching is by pricing zone: a driver's routePreferences towns are resolved
 * to zones and compared against the request's pickup/destination zones. A
 * driver with no route preferences sees all open requests.
 */
export const getAvailableRequestsService = async (
  driverUserId: Types.ObjectId,
): Promise<ServiceResponse> => {
  const profile = await DriverProfile.findOne({ user: driverUserId });
  if (!profile) {
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };
  }

  if (!profile.isOnline) {
    return {
      status: StatusCodes.FORBIDDEN,
      message: "You must be online to view ride requests",
    };
  }

  // Heartbeat: this poll proves the driver is active. Then sweep other drivers
  // who have gone stale so they stop appearing as available for matching.
  profile.lastSeenAt = new Date();
  await profile.save();
  await markStaleDriversOffline();

  // Resolve the driver's route preferences into zone pairs for matching.
  const zonePairs = (profile.routePreferences || [])
    .map((pref) => {
      const from = resolveTown(pref.from);
      const to = resolveTown(pref.to);
      return from && to ? { fromZone: from.zoneId, toZone: to.zoneId } : null;
    })
    .filter((pair): pair is { fromZone: string; toZone: string } => pair !== null);

  const openRequests = await Booking.find({
    status: "requested",
    createdAt: { $gte: requestExpiryCutoff() },
  })
    .populate("passenger", "name phoneNumber profileImage")
    .sort({ createdAt: 1 });

  const matches =
    zonePairs.length === 0
      ? openRequests
      : openRequests.filter((booking) =>
          zonePairs.some(
            (pair) =>
              pair.fromZone === booking.pickup?.zoneId &&
              pair.toZone === booking.destination?.zoneId,
          ),
        );

  return {
    status: StatusCodes.OK,
    message: "Available ride requests retrieved",
    data: { count: matches.length, requests: matches },
  };
};

/**
 * Driver accepts an open ride request. Uses an atomic conditional update so
 * that only one driver can win a given request.
 */
export const acceptBookingService = async (
  driverUserId: Types.ObjectId,
  bookingId: string,
): Promise<ServiceResponse> => {
  const profile = await DriverProfile.findOne({ user: driverUserId });
  if (!profile) {
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };
  }

  // Acting on a request counts as activity.
  profile.lastSeenAt = new Date();
  await profile.save();

  // A driver can only handle one live trip at a time.
  const busy = await Booking.findOne({
    driver: profile._id,
    status: { $in: ["accepted", "arrived", "in_progress"] },
  });
  if (busy) {
    return {
      status: StatusCodes.CONFLICT,
      message: "Finish your current trip before accepting another",
      data: { bookingId: busy._id, status: busy.status },
    };
  }

  const vehicle = await Vehicle.findOne({
    driver: profile._id,
    vehicleStatus: "approved",
  });

  // Atomic claim: only succeeds if the booking is still 'requested'.
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: "requested" },
    {
      $set: {
        driver: profile._id,
        vehicle: vehicle?._id ?? null,
        status: "accepted",
        acceptedAt: new Date(),
      },
    },
    { new: true },
  )
    .populate("passenger", "name phoneNumber profileImage")
    .populate("vehicle");

  if (!booking) {
    // Either the id was wrong or another driver already claimed it.
    const stillExists = await Booking.exists({ _id: bookingId });
    return stillExists
      ? {
          status: StatusCodes.CONFLICT,
          message: "This request is no longer available",
        }
      : {
          status: StatusCodes.NOT_FOUND,
          message: "Booking not found",
        };
  }

  return {
    status: StatusCodes.OK,
    message: "Ride accepted. Head to the pickup point.",
    data: { booking },
  };
};

/**
 * Driver advances a trip through its lifecycle: arrived -> in_progress ->
 * completed. Transitions are validated against the current status.
 */
export const updateBookingStatusService = async (
  driverUserId: Types.ObjectId,
  bookingId: string,
  nextStatus: BookingStatus,
): Promise<ServiceResponse> => {
  const profile = await DriverProfile.findOne({ user: driverUserId });
  if (!profile) {
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };
  }

  // Progressing a trip counts as activity.
  profile.lastSeenAt = new Date();
  await profile.save();

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return { status: StatusCodes.NOT_FOUND, message: "Booking not found" };
  }

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

  booking.status = nextStatus;
  const timestampField = STATUS_TIMESTAMP[nextStatus];
  if (timestampField) {
    (booking as any)[timestampField] = new Date();
  }

  if (nextStatus === "completed") {
    booking.fareFinal = booking.fareEstimate;
  }

  await booking.save();

  // On completion, release any escrowed payment to the driver's wallet. This is
  // a no-op for rides paid off-platform in cash. The payments module owns the
  // booking.paymentStatus transition to "released".
  if (nextStatus === "completed") {
    await paymentService.releaseEscrowForBooking(String(booking._id));
  }

  return {
    status: StatusCodes.OK,
    message: `Booking marked as ${nextStatus}`,
    data: { booking },
  };
};

/**
 * Cancel a booking. Either the passenger or the assigned driver may cancel
 * while the trip has not started (or completed).
 */
export const cancelBookingService = async (
  userId: Types.ObjectId,
  role: CancelledBy,
  bookingId: string,
  reason?: string,
): Promise<ServiceResponse> => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return { status: StatusCodes.NOT_FOUND, message: "Booking not found" };
  }

  // Authorize: passenger owner, or the driver assigned to the trip.
  let isParticipant = false;
  if (role === "passenger") {
    isParticipant = String(booking.passenger) === String(userId);
  } else if (role === "driver") {
    const profile = await DriverProfile.findOne({ user: userId });
    isParticipant =
      !!profile && String(booking.driver) === String(profile._id);
  }

  if (!isParticipant) {
    return {
      status: StatusCodes.FORBIDDEN,
      message: "You are not allowed to cancel this booking",
    };
  }

  const cancellable: BookingStatus[] = ["requested", "accepted", "arrived"];
  if (!cancellable.includes(booking.status as BookingStatus)) {
    return {
      status: StatusCodes.BAD_REQUEST,
      message: `A booking that is '${booking.status}' cannot be cancelled`,
    };
  }

  booking.status = "cancelled";
  booking.cancellation = { by: role, reason, at: new Date() };
  await booking.save();

  // Refund any escrowed payment to the passenger. No-op for unpaid/cash rides;
  // the payments module owns the booking.paymentStatus -> refunded transition.
  await paymentService.refundForBooking(String(booking._id));

  const refreshed = await Booking.findById(booking._id);

  return {
    status: StatusCodes.OK,
    message: "Booking cancelled",
    data: { booking: refreshed ?? booking },
  };
};

/**
 * List the caller's bookings (as passenger or driver) with optional status
 * filtering and pagination.
 */
export const getMyBookingsService = async (
  userId: Types.ObjectId,
  role: "passenger" | "driver",
  query: { status?: string; page?: number; limit?: number },
): Promise<ServiceResponse> => {
  const filter: Record<string, unknown> = {};

  if (role === "driver") {
    const profile = await DriverProfile.findOne({ user: userId });
    if (!profile) {
      return {
        status: StatusCodes.NOT_FOUND,
        message: "Driver profile not found",
      };
    }
    filter.driver = profile._id;
  } else {
    filter.passenger = userId;
  }

  if (query.status) {
    filter.status = query.status;
  }

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

  return {
    status: StatusCodes.OK,
    message: "Bookings retrieved",
    data: {
      bookings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
  };
};

/**
 * Fetch a single booking. Only the passenger or the assigned driver may view it.
 */
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

  if (!booking) {
    return { status: StatusCodes.NOT_FOUND, message: "Booking not found" };
  }

  const isPassenger = String(booking.passenger?._id ?? booking.passenger) === String(userId);
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
    data: { booking },
  };
};
