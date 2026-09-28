import { Router } from "express";
import validate from "../middleware/validation.middleware";
import {
  updateDriverStatusSchema,
  updateVehicleStatusSchema,
} from "../validators/admin.validator";
import {
  listDrivers,
  listVehicles,
  getDriverDetail,
  updateDriverStatus,
  updateVehicleStatus,
  runPayouts,
} from "../controllers/admin.controller";
const router = Router();

// Review queues (default to items awaiting approval; ?status=all|pending|approved|...)
router.get("/drivers", listDrivers);
router.get("/drivers/:driverId", getDriverDetail);
router.get("/vehicles", listVehicles);

// On-demand driver payout sweep (also runs automatically on a schedule).
router.post("/payouts/run", runPayouts);

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
