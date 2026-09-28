import { Request, Response } from "express";
import * as bookingService from "../services/booking/booking.service";
import type { CancelledBy } from "../types/booking.types";

export const estimateFare = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { pickupTown, destinationTown, seats } = req.body;
  const result = await bookingService.estimateFareService(
    pickupTown,
    destinationTown,
    seats,
  );
  res.status(result.status).json({ message: result.message, data: result.data });
};

export const createBooking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await bookingService.createBookingService(
    req.user!._id,
    req.body,
  );
  res.status(result.status).json({ message: result.message, data: result.data });
};

export const getAvailableRequests = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await bookingService.getAvailableRequestsService(req.user!._id);
  res.status(result.status).json({ message: result.message, data: result.data });
};

export const acceptBooking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await bookingService.acceptBookingService(
    req.user!._id,
    req.params.id as string,
  );
  res.status(result.status).json({ message: result.message, data: result.data });
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
  res.status(result.status).json({ message: result.message, data: result.data });
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
  res.status(result.status).json({ message: result.message, data: result.data });
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
  res.status(result.status).json({ message: result.message, data: result.data });
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
  res.status(result.status).json({ message: result.message, data: result.data });
};
