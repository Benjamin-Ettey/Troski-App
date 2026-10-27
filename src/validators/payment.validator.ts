import { z } from "zod";

export const initializePaymentSchema = z.object({
  bookingId: z.string().trim().min(1, "bookingId is required"),
  phoneNumber: z.string().trim().min(10, "Valid phone number is required"),
  provider: z.enum(["mtn", "tgo", "vdc"], {
    message: "Provider must be mtn, tgo, or vdc",
  }),
});
