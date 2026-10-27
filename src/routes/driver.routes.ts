import { Router } from "express";
import { upload } from "../middleware/multer.middleware";
import validate from "../middleware/validation.middleware";
import { requireApprovedDriver } from "../middleware/requireApprovedDriver";
import {
  submitKycSchema,
  submitVehicleSchema,
  startRunSchema,
  runLocationSchema,
  runSeatsSchema,
} from "../validators/driver.validator";
import {
  submitKyc,
  submitVehicle,
  toggleOnlineStatus,
  getMyStatus,
  startRun,
  updateRunLocation,
  updateRunSeats,
  endRun,
  getActiveRun,
  listDemand,
  acceptDemand,
} from "../controllers/driver.controller";
const router = Router();

// A driver checks their own verification/approval state. Intentionally not
// behind requireApprovedDriver — they need this most before they're approved.
router.get("/status", getMyStatus);

router.post(
  "/kyc",
  upload.fields([
    { name: "ghanaCardImage", maxCount: 1 },
    { name: "licenseImage", maxCount: 1 },
  ]),
  validate(submitKycSchema),
  submitKyc,
);

router.post(
  "/vehicle",
  upload.fields([
    { name: "vehicleImage", maxCount: 1 },
    { name: "insuranceCertImage", maxCount: 1 },
    { name: "vehicleRegDocImage", maxCount: 1 },
    { name: "DVLARoadworthyImage", maxCount: 1 },
  ]),
  validate(submitVehicleSchema),
  submitVehicle,
);

router.patch(
  "/toggle-online",
  requireApprovedDriver,
  toggleOnlineStatus,
);

// ---- Live runs (declare route, share GPS, manage seats) ----
router.get("/runs/active", requireApprovedDriver, getActiveRun);
router.post(
  "/runs/start",
  requireApprovedDriver,
  validate(startRunSchema),
  startRun,
);
router.patch(
  "/runs/location",
  requireApprovedDriver,
  validate(runLocationSchema),
  updateRunLocation,
);
router.patch(
  "/runs/seats",
  requireApprovedDriver,
  validate(runSeatsSchema),
  updateRunSeats,
);
router.post("/runs/end", requireApprovedDriver, endRun);

// ---- Demand (new-route offers from clustered unmet requests) ----
router.get("/demand", requireApprovedDriver, listDemand);
router.post("/demand/:id/accept", requireApprovedDriver, acceptDemand);

export default router;
