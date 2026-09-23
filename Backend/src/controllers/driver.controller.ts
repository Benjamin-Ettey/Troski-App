import { Request, Response } from "express";
import * as driverService from "../services/driver/driver.service";

export const submitKyc = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const result = await driverService.submitKycService(
    req.user!._id,
    req.body,
    files || {},
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const submitVehicle = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const result = await driverService.submitVehicleService(
    req.user!._id,
    req.body,
    files || {},
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const toggleOnlineStatus = async (req: Request, res: Response): Promise<void> => {
  const { isOnline } = req.body;
  const result = await driverService.toggleOnlineStatusService(req.user!._id, isOnline);
  res.status(result.status).json({ message: result.message, data: result.data });
};