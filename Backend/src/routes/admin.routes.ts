import { Router } from "express";
import validate from "../middleware/validation.middleware";
import {
  updateDriverStatusSchema,
  updateVehicleStatusSchema,
} from "../validators/admin.validator";
import {
  updateDriverStatus,
  updateVehicleStatus,
} from "../controllers/admin.controller";
const router = Router();

router.patch(
  "/:driverId/status",
  validate(updateDriverStatusSchema),
  updateDriverStatus,
);

router.patch(
  "/vehicle/:vehicleId/status",
  validate(updateVehicleStatusSchema),
  updateVehicleStatus,
);

export default router;
