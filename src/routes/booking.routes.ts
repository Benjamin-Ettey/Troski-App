import { Router } from "express";
import validate from "../middleware/validation.middleware";
import { authorizeRoles } from "../middleware/auth.middleware";
import { requireApprovedDriver } from "../middleware/requireApprovedDriver";
import {
  estimateFareSchema,
  createBookingSchema,
  matchRideSchema,
  updateBookingStatusSchema,
  cancelBookingSchema,
} from "../validators/booking.validator";
import {
  estimateFare,
  createBooking,
  matchRide,
  getAvailableRequests,
  acceptBooking,
  updateBookingStatus,
  cancelBooking,
  getMyBookings,
  getBookingById,
  trackBooking,
} from "../controllers/booking.controller";

// Mounted behind authenticateUser (see server.ts). Role is enforced per-route.
const router = Router();

// ---- Passenger endpoints ----
router.post(
  "/estimate",
  authorizeRoles("passenger"),
  validate(estimateFareSchema),
  estimateFare,
);

router.post(
  "/",
  authorizeRoles("passenger"),
  validate(createBookingSchema),
  createBooking,
);

// Route-following match: find the best en-route trotro + pickup point.
router.post(
  "/match",
  authorizeRoles("passenger"),
  validate(matchRideSchema),
  matchRide,
);

// ---- Driver endpoints ----
router.get(
  "/available",
  authorizeRoles("driver"),
  requireApprovedDriver,
  getAvailableRequests,
);

router.patch(
  "/:id/accept",
  authorizeRoles("driver"),
  requireApprovedDriver,
  acceptBooking,
);

router.patch(
  "/:id/status",
  authorizeRoles("driver"),
  requireApprovedDriver,
  validate(updateBookingStatusSchema),
  updateBookingStatus,
);

// ---- Shared endpoints (passenger or driver participant) ----
router.get("/", authorizeRoles("passenger", "driver"), getMyBookings);

router.patch(
  "/:id/cancel",
  authorizeRoles("passenger", "driver"),
  validate(cancelBookingSchema),
  cancelBooking,
);

// Live tracking stream (passenger or assigned driver). Declared before /:id.
router.get(
  "/:id/track",
  authorizeRoles("passenger", "driver"),
  trackBooking,
);

router.get("/:id", getBookingById);

export default router;
