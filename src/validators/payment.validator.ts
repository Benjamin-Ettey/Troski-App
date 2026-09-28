import { z } from "zod";

export const initializePaymentSchema = z.object({
  bookingId: z.string().trim().min(1, "bookingId is required"),
});
