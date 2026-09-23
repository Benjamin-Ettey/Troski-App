import { Types } from "mongoose";

export type MomoProvider = "MTN" | "Telecel" | "AirtelTigo";
export type VerificationStatus = "incomplete" | "pending" | "approved" | "rejected" | "suspended";
export type VehicleStatus = "pending" | "approved" | "rejected";

export interface RoutePreference {
  from: string;
  to: string;
}

export interface IDriverProfile {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  ghanaCardNumber?: string;
  ghanaCardImage?: string;
  licenseNumber?: string;
  licenseImage?: string;
  licenseExpiryDate?: Date;
  verificationStatus: VerificationStatus;
  routePreferences: RoutePreference[];
  momoProvider?: MomoProvider;
  momoNumber?: string;
  rejectionReason?: string;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVehicle {
  _id: Types.ObjectId;
  driver: Types.ObjectId;
  vehicleType: string;
  plateNumber: string;
  vehicleColor: string;
  vehicleCapacity: number;
  vehicleImage: string;
  insuranceCertImage: string;
  vehicleRegDocImage: string;
  DVLARoadworthyImage: string;
  vehicleStatus: VehicleStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}