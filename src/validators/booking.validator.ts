import { z } from "zod";

export const estimateFareSchema = z.object({
  pickupTown: z.string().trim().min(2, "Pickup town is required"),
  destinationTown: z.string().trim().min(2, "Destination town is required"),
  seats: z.coerce.number().int().min(1).max(6).default(1),
});

export const createBookingSchema = z.object({
  pickupTown: z.string().trim().min(2, "Pickup town is required"),
  destinationTown: z.string().trim().min(2, "Destination town is required"),
  seats: z.coerce.number().int().min(1).max(6).default(1),
  paymentMethod: z.enum(["cash", "momo"]).default("cash"),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["arrived", "in_progress", "completed"]),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(300, "Reason is too long").optional(),
});
