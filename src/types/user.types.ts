import { Types } from "mongoose";

export type RoleType = "passenger" | "driver" | "admin";
export type AccountStatusType = "active" | "suspended" | "deactivated";
export type DriverVerificationStatus =
  | "incomplete"
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";
export type VehicleStatus = "pending" | "approved" | "rejected";
export type OtpPurpose =
  | "signup"
  | "login"
  | "reset_pin"
  | "change_phone"
  | "sensitive_transaction";

export type RoutePreference = {
  from: string;
  to: string;
};

export type TokenUser = {
  _id: Types.ObjectId;
  name: string;
  role: RoleType;
  accountStatus: AccountStatusType;
};
