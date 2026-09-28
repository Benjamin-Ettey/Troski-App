import { Request, Response } from "express";
import { paymentService } from "../services/payment/payment.service";

export const initializePayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await paymentService.initializeCharge(
    req.user!._id,
    req.body.bookingId,
  );
  res.status(result.status).json({ message: result.message, data: result.data });
};

export const verifyPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await paymentService.verifyAndApply(
    req.user!._id,
    req.params.reference as string,
  );
  res.status(result.status).json({ message: result.message, data: result.data });
};

// Public endpoint hit by Paystack. Mounted with a raw body parser (see app.ts)
// so the signature can be verified against the exact bytes Paystack signed.
export const handlePaystackWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const signature = req.headers["x-paystack-signature"] as string | undefined;
  const result = await paymentService.handleWebhook(
    req.body as Buffer,
    signature,
  );
  res.sendStatus(result.status);
};
