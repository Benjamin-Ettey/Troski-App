export type BookingStatus =
  | "requested" // passenger created the request, waiting for a driver
  | "accepted" // a driver accepted, heading to pickup
  | "arrived" // driver reached the pickup point
  | "in_progress" // trip has started
  | "completed" // trip finished
  | "cancelled" // cancelled by passenger or driver
  | "expired" // no driver accepted within the allowed window
  | "no_drivers"; // no matching drivers were available at request time

export type PaymentMethod = "cash" | "momo";

export type PaymentStatus =
  | "pending"
  | "escrow_held"
  | "released"
  | "refunded"
  | "failed";

export type CancelledBy = "passenger" | "driver" | "system";

export type LocationPoint = {
  town: string;
  zoneId: string;
  latitude: number;
  longitude: number;
};
