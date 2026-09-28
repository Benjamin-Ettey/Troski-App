import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as adminService from "../services/admin/admin.service";
import { payoutService } from "../services/payment/payout.service";

// Manually trigger a driver payout sweep (for testing / on-demand runs).
export const runPayouts = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const summary = await payoutService.runScheduledPayouts();
  res
    .status(StatusCodes.OK)
    .json({ message: "Payout sweep complete", data: summary });
};

export const listDrivers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await adminService.listDriversService({
    status: req.query.status as string | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.status(result.status).json({ message: result.message, data: result.data });
};

export const listVehicles = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await adminService.listVehiclesService({
    status: req.query.status as string | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.status(result.status).json({ message: result.message, data: result.data });
};

export const getDriverDetail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await adminService.getDriverDetailService(
    req.params.driverId as string,
  );
  res.status(result.status).json({ message: result.message, data: result.data });
};

export const updateDriverStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { driverId } = req.params;
  const { status, rejectionReason } = req.body;
  const result = await adminService.updateDriverStatusService(
    driverId,
    status,
    rejectionReason,
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const updateVehicleStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { vehicleId } = req.params;
  const { status, rejectionReason } = req.body;
  const result = await adminService.updateVehicleStatusService(
    vehicleId,
    status,
    rejectionReason,
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};
