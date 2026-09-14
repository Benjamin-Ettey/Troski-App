import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import DriverProfile from "../models/DriverProfile";

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

    next();
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};
