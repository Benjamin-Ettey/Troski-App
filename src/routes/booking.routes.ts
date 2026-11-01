import { Router } from "express";
import validate from "../middleware/validation.middleware";
import { authorizeRoles } from "../middleware/auth.middleware";
import { requireApprovedDriver } from "../middleware/requireApprovedDriver";
import {
  estimateFareSchema,
  matchRideSchema,
  updateBookingStatusSchema,
  cancelBookingSchema,
} from "../validators/booking.validator";
import {
  estimateFare,
  matchRide,
  getDemandStatus,
  acceptBooking,
  declineBooking,
  updateBookingStatus,
  cancelBooking,
  getMyBookings,
  getBookingById,
  trackBooking,
  getBookingRideDetails,
} from "../controllers/booking.controller";

const router = Router();

// Passenger endpoints
router.post(
  "/estimate",
  authorizeRoles("passenger"),
  validate(estimateFareSchema),
  estimateFare,
);

router.patch(
  "/match",
  authorizeRoles("passenger"),
  validate(matchRideSchema),
  matchRide,
);

// Status of an unmet-demand request (created when a match finds no van).
router.get("/demand/:id", authorizeRoles("passenger"), getDemandStatus);

// Driver endpoints
router.patch(
  "/:id/accept",
  authorizeRoles("driver"),
  requireApprovedDriver,
  acceptBooking,
);

router.patch(
  "/:id/decline",
  authorizeRoles("driver"),
  requireApprovedDriver,
  declineBooking,
);

router.patch(
  "/:id/status",
  authorizeRoles("driver"),
  requireApprovedDriver,
  validate(updateBookingStatusSchema),
  updateBookingStatus,
);

// Shared endpoints (passenger or driver)
router.get("/", authorizeRoles("passenger", "driver"), getMyBookings);

router.patch(
  "/:id/cancel",
  authorizeRoles("passenger", "driver"),
  validate(cancelBookingSchema),
  cancelBooking,
);

router.get(
  "/:id/details",
  authorizeRoles("passenger", "driver"),
  getBookingRideDetails,
);
router.get("/:id/track", authorizeRoles("passenger", "driver"), trackBooking);
router.get("/:id", getBookingById);

export default router;
