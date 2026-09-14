import { StatusCodes } from "http-status-codes";
import DriverProfile from "../../models/DriverProfile";
import Vehicle from "../../models/Vehicle";
import { uploadSingleFile } from "../fileUpload/fileUpload.service";
import { ServiceResponse } from "../auth/local/auth.service";
import { Types } from "mongoose";

export const submitKycService = async (
  userId: Types.ObjectId,
  payload: any,
  files: { [fieldname: string]: Express.Multer.File[] },
): Promise<ServiceResponse> => {
  const profile = await DriverProfile.findOne({ user: userId });
  if (!profile) {
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };
  }

  // Upload provided images and save their URLs
  if (files.ghanaCardImage?.[0]) {
    const { url } = await uploadSingleFile(
      files.ghanaCardImage[0],
      "troski/kyc/ids",
    );
    profile.ghanaCardImage = url;
  }
  if (files.licenseImage?.[0]) {
    const { url } = await uploadSingleFile(
      files.licenseImage[0],
      "troski/kyc/licenses",
    );
    profile.licenseImage = url;
  }

  let parsedRoutePreferences = profile.routePreferences;
  if (payload.routePreferences) {
    try {
      parsedRoutePreferences =
        typeof payload.routePreferences === "string"
          ? JSON.parse(payload.routePreferences)
          : payload.routePreferences;
    } catch (error) {
      return {
        status: StatusCodes.BAD_REQUEST,
        message:
          "Invalid format for routePreferences. Must be a valid JSON array.",
      };
    }
  }

  // Update text fields
  Object.assign(profile, {
    ghanaCardNumber: payload.ghanaCardNumber || profile.ghanaCardNumber,
    licenseNumber: payload.licenseNumber || profile.licenseNumber,
    licenseExpiryDate: payload.licenseExpiryDate || profile.licenseExpiryDate,
    momoNumber: payload.momoNumber || profile.momoNumber,
    routePreferences: parsedRoutePreferences,
  });

  // Automatically mark as pending if basic documents are present
  if (
    profile.ghanaCardImage &&
    profile.licenseImage &&
    profile.verificationStatus === "incomplete"
  ) {
    profile.verificationStatus = "pending";
  }

  await profile.save();
  return {
    status: StatusCodes.OK,
    message: "KYC details submitted successfully",
    data: profile,
  };
};

export const submitVehicleService = async (
  userId: Types.ObjectId,
  payload: any,
  files: { [fieldname: string]: Express.Multer.File[] },
): Promise<ServiceResponse> => {
  const profile = await DriverProfile.findOne({ user: userId });
  if (!profile) {
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };
  }

  let vehicle = await Vehicle.findOne({ driver: profile._id });
  if (!vehicle) {
    vehicle = new Vehicle({ driver: profile._id, ...payload });
  } else {
    Object.assign(vehicle, payload);
    if (vehicle.vehicleStatus === "rejected") {
      vehicle.vehicleStatus = "pending"; // Reset status on re-submission
    }
  }

  // Upload vehicle images
  if (files.vehicleImage?.[0]) {
    const { url } = await uploadSingleFile(
      files.vehicleImage[0],
      "troski/vehicles/images",
    );
    vehicle.vehicleImage = url;
  }
  if (files.insuranceCertImage?.[0]) {
    const { url } = await uploadSingleFile(
      files.insuranceCertImage[0],
      "troski/vehicles/insurance",
    );
    vehicle.insuranceCertImage = url;
  }
  if (files.vehicleRegDocImage?.[0]) {
    const { url } = await uploadSingleFile(
      files.vehicleRegDocImage[0],
      "troski/vehicles/registration",
    );
    vehicle.vehicleRegDocImage = url;
  }
  if (files.DVLARoadworthyImage?.[0]) {
    const { url } = await uploadSingleFile(
      files.DVLARoadworthyImage[0],
      "troski/vehicles/roadworthy",
    );
    vehicle.DVLARoadworthyImage = url;
  }

  await vehicle.save();
  return {
    status: StatusCodes.OK,
    message: "Vehicle details submitted successfully",
    data: vehicle,
  };
};

export const toggleOnlineStatusService = async (
  userId: Types.ObjectId,
  isOnline: boolean,
): Promise<ServiceResponse> => {
  const profile = await DriverProfile.findOne({ user: userId });
  if (!profile) {
    return {
      status: StatusCodes.NOT_FOUND,
      message: "Driver profile not found",
    };
  }

  profile.isOnline = isOnline;
  await profile.save();

  return {
    status: StatusCodes.OK,
    message: `You are now ${isOnline ? "online" : "offline"}`,
    data: { isOnline: profile.isOnline },
  };
};
