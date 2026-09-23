import { Request, Response } from "express";
import * as adminService from "../services/admin/admin.service";

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
