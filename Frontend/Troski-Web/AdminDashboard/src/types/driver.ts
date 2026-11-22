export type DriverStatus =
  | "pending"
  | "needs_corrections"
  | "approved"
  | "rejected"
  | "suspended"
  | "deactivated";

// Same fields as the public Driver Application form
export interface DriverApplication {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  vehicleRegistration: string;
  licenseNumber: string;
  status: DriverStatus;
  submittedAt: string; // ISO date
}

export interface DashboardStats {
  pending: number;
  needsCorrections: number;
  approved: number;
  suspended: number;
}