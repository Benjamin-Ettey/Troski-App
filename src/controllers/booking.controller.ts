import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as bookingService from "../services/booking/booking.service";
import { matchRideService } from "../services/booking/match.service";
import { getDemandStatusService } from "../services/booking/demand.service";
import { bookingChannel } from "../services/booking/tracking.service";
import { subscribe, sendTo } from "../services/realtime/sse";
import Booking from "../models/Booking";
import DriverProfile from "../models/DriverProfile";
import DriverRun from "../models/DriverRun";
import type { CancelledBy } from "../types/booking.types";
import {
  canAccessRideDetails,
  getBookingRideDetailsService,
} from "../services/booking/booking.service";

export const trackBooking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const bookingId = req.params.id as string;
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "Booking not found" });
    return;
  }

  const userId = req.user!._id;
  const isPassenger = String(booking.passenger) === String(userId);
  let isDriver = false;
  if (req.user!.role === "driver") {
    const profile = await DriverProfile.findOne({ user: userId });
    isDriver = !!profile && String(booking.driver) === String(profile._id);
  }
  if (!isPassenger && !isDriver) {
    res
      .status(StatusCodes.FORBIDDEN)
      .json({ message: "You are not allowed to track this booking" });
    return;
  }

  subscribe(bookingChannel(bookingId), res);

  // ENFORCEMENT: Only emit the initial GPS state if payment allows
  if (booking.run && canAccessRideDetails(booking)) {
    const run = await DriverRun.findById(booking.run);
    if (run?.currentLocation?.coordinates) {
      sendTo(res, "van_location", {
        van: {
          latitude: run.currentLocation.coordinates[1],
          longitude: run.currentLocation.coordinates[0],
        },
        etaMinutes: booking.etaMinutes,
        pickupPoint: booking.pickupPoint,
        status: booking.status,
      });
    }
  }
};

export const matchRide = async (req: Request, res: Response): Promise<void> => {
  const result = await matchRideService(req.user!._id, req.body);
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const getDemandStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await getDemandStatusService(
    req.user!._id,
    req.params.id as string,
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const estimateFare = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    pickupLatitude,
    pickupLongitude,
    dropoffLatitude,
    dropoffLongitude,
    seats,
  } = req.body;

  if (
    !pickupLatitude ||
    !pickupLongitude ||
    !dropoffLatitude ||
    !dropoffLongitude
  ) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: "Please provide all pickup and dropoff coordinates",
    });
    return;
  }

  const result = await bookingService.estimateFareService(
    Number(pickupLatitude),
    Number(pickupLongitude),
    Number(dropoffLatitude),
    Number(dropoffLongitude),
    seats ? Number(seats) : 1,
  );

  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const acceptBooking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await bookingService.acceptBookingService(
    req.user!._id,
    req.params.id as string,
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const declineBooking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await bookingService.declineBookingService(
    req.user!._id,
    req.params.id as string,
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const updateBookingStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await bookingService.updateBookingStatusService(
    req.user!._id,
    req.params.id as string,
    req.body.status,
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const cancelBooking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await bookingService.cancelBookingService(
    req.user!._id,
    req.user!.role as CancelledBy,
    req.params.id as string,
    req.body.reason,
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const getMyBookings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await bookingService.getMyBookingsService(
    req.user!._id,
    req.user!.role as "passenger" | "driver",
    {
      status: req.query.status as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    },
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const getBookingById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await bookingService.getBookingByIdService(
    req.user!._id,
    req.user!.role,
    req.params.id as string,
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const getBookingRideDetails = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await getBookingRideDetailsService(
    req.user!._id,
    req.params.id as string,
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};
