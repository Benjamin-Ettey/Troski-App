import { Request, Response } from "express";
import * as driverService from "../services/driver/driver.service";
import * as runService from "../services/driver/run.service";
import * as demandService from "../services/booking/demand.service";

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

export const toggleOnlineStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { isOnline } = req.body;
  const result = await driverService.toggleOnlineStatusService(
    req.user!._id,
    isOnline,
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const getMyStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await driverService.getVerificationStatusService(
    req.user!._id,
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const startRun = async (req: Request, res: Response): Promise<void> => {
  const result = await runService.startRunService(req.user!._id, req.body);
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const updateRunLocation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await runService.updateLocationService(
    req.user!._id,
    req.body,
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const updateRunSeats = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await runService.updateSeatsService(req.user!._id, req.body);
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const endRun = async (req: Request, res: Response): Promise<void> => {
  const result = await runService.endRunService(req.user!._id);
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const getActiveRun = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await runService.getActiveRunService(req.user!._id);
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const listDemand = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await demandService.listDemandForDriverService(req.user!._id);
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};

export const acceptDemand = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await demandService.acceptDemandService(
    req.user!._id,
    req.params.id as string,
  );
  res
    .status(result.status)
    .json({ message: result.message, data: result.data });
};
