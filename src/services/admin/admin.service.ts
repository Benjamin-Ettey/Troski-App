import { StatusCodes } from "http-status-codes";
import {
  sendKycStatusEmail,
  sendVehicleStatusEmail,
} from "../email/email.service";
import DriverProfile from "../../models/DriverProfile";
import Vehicle from "../../models/Vehicle";
import { ServiceResponse } from "../auth/local/auth.service";

type ListQuery = { status?: string; page?: number; limit?: number };

const paginate = (query: ListQuery) => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 20));
  return { page, limit, skip: (page - 1) * limit };
};

/**
 * List driver profiles for admin review. Defaults to those awaiting review
 * (verificationStatus "pending"); pass ?status=all for everyone, or a specific
 * status. Each driver is returned with their vehicle (if any) attached.
 */
export const listDriversService = async (
  query: ListQuery,
): Promise<ServiceResponse> => {
  const filter: Record<string, unknown> = {};
  if (query.status && query.status !== "all") {
    filter.verificationStatus = query.status;
  } else if (!query.status) {
    filter.verificationStatus = "pending";
  }

  const { page, limit, skip } = paginate(query);

  const [drivers, total] = await Promise.all([
    DriverProfile.find(filter)
      .populate("user", "name email phoneNumber profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    DriverProfile.countDocuments(filter),
  ]);

  // Attach each driver's vehicle in a single extra query (avoids N+1).
  const vehicles = await Vehicle.find({
    driver: { $in: drivers.map((d) => d._id) },
  });
  const vehicleByDriver = new Map(
    vehicles.map((v) => [String(v.driver), v]),
  );

  const data = drivers.map((d) => ({
    ...d.toObject(),
    vehicle: vehicleByDriver.get(String(d._id)) ?? null,
  }));

  return {
    status: StatusCodes.OK,
    message: "Drivers retrieved",
    data: {
      drivers: data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
  };
};

/**
 * List vehicles for admin review. Defaults to those awaiting review
 * (vehicleStatus "pending"); pass ?status=all or a specific status.
 */
export const listVehiclesService = async (
  query: ListQuery,
): Promise<ServiceResponse> => {
  const filter: Record<string, unknown> = {};
  if (query.status && query.status !== "all") {
    filter.vehicleStatus = query.status;
  } else if (!query.status) {
    filter.vehicleStatus = "pending";
  }

  const { page, limit, skip } = paginate(query);

  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter)
      .populate({
        path: "driver",
        select: "user verificationStatus",
        populate: { path: "user", select: "name email phoneNumber" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Vehicle.countDocuments(filter),
  ]);

  return {
    status: StatusCodes.OK,
    message: "Vehicles retrieved",
    data: {
      vehicles,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
  };
};

/**
 * Full detail for a single driver (profile + user + vehicle) for admin review.
 */
export const getDriverDetailService = async (
  driverId: string,
): Promise<ServiceResponse> => {
  const profile = await DriverProfile.findById(driverId).populate(
    "user",
    "name email phoneNumber profileImage accountStatus",
  );
  if (!profile) {
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };
  }

  const vehicle = await Vehicle.findOne({ driver: profile._id });

  return {
    status: StatusCodes.OK,
    message: "Driver detail retrieved",
    data: { ...profile.toObject(), vehicle: vehicle ?? null },
  };
};

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
