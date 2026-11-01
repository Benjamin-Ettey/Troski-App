import { Router } from "express";
import validate from "../middleware/validation.middleware";
import { authorizeRoles } from "../middleware/auth.middleware";
import { initializePaymentSchema } from "../validators/payment.validator";
import {
  initializePayment,
  verifyPayment,
} from "../controllers/payment.controller";

const router = Router();

router.post(
  "/initialize",
  authorizeRoles("passenger"),
  validate(initializePaymentSchema),
  initializePayment,
);

router.get("/:reference/verify", authorizeRoles("passenger"), verifyPayment);

export default router;
