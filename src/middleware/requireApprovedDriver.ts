import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import DriverProfile from "../models/DriverProfile";
import Vehicle from "../models/Vehicle";

export const requireApprovedDriver = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const profile = await DriverProfile.findOne({ user: req.user?._id });

    if (!profile) {
      res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Driver profile not found." });
      return;
    }

    if (profile.verificationStatus !== "approved") {
      res.status(StatusCodes.FORBIDDEN).json({
        message: `Action denied. Driver account status is currently '${profile.verificationStatus}'.`,
      });
      return;
    }

    // A driver is only dispatchable with an approved vehicle. Profile approval
    // and vehicle approval are granted separately, so enforce both here — the
    // single gate in front of going online and accepting rides.
    const vehicle = await Vehicle.findOne({
      driver: profile._id,
      vehicleStatus: "approved",
    });

    if (!vehicle) {
      res.status(StatusCodes.FORBIDDEN).json({
        message:
          "Action denied. You need an approved vehicle before you can go online or accept rides.",
      });
      return;
    }

    next();
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};
