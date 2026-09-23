import { StatusCodes } from "http-status-codes";
import {
  sendKycStatusEmail,
  sendVehicleStatusEmail,
} from "../email/email.service";
import DriverProfile from "../../models/DriverProfile";
import Vehicle from "../../models/Vehicle";
import { ServiceResponse } from "../auth/local/auth.service";

export const updateDriverStatusService = async (
  driverId: string | string[],
  status: "approved" | "rejected" | "suspended",
  reason?: string,
): Promise<ServiceResponse> => {
  const profile = await DriverProfile.findById(driverId).populate(
    "user",
    "name email",
  );
  if (!profile)
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };

  profile.verificationStatus = status;
  profile.rejectionReason =
    status === "rejected" || status === "suspended" ? reason : undefined;
  await profile.save();

  const user = profile.user as any;
  if (user && user.email) {
    await sendKycStatusEmail(
      user.email,
      user.name,
      status as "approved" | "rejected",
      reason,
    );
  }

  return {
    status: StatusCodes.OK,
    message: `Driver status updated to ${status}`,
    data: profile,
  };
};

export const updateVehicleStatusService = async (
  vehicleId: string | string[],
  status: "approved" | "rejected",
  reason?: string,
): Promise<ServiceResponse> => {
  const vehicle = await Vehicle.findById(vehicleId).populate({
    path: "driver",
    populate: { path: "user", select: "name email" },
  });
  if (!vehicle)
    return { status: StatusCodes.NOT_FOUND, message: "Vehicle not found" };

  vehicle.vehicleStatus = status;
  vehicle.rejectionReason = status === "rejected" ? reason : undefined;
  await vehicle.save();

  const driver = vehicle.driver as any;
  const user = driver?.user;

  if (user && user.email) {
    await sendVehicleStatusEmail(
      user.email,
      user.name,
      vehicle.plateNumber,
      status,
      reason,
    );
  }

  return {
    status: StatusCodes.OK,
    message: `Vehicle status updated to ${status}`,
    data: vehicle,
  };
};
