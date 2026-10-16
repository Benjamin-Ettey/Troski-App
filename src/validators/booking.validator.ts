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

export const matchRideSchema = z
  .object({
    pickupLat: z.coerce.number().min(-90).max(90),
    pickupLng: z.coerce.number().min(-180).max(180),
    // Destination: coordinates (dropped pin) OR a town name.
    destLat: z.coerce.number().min(-90).max(90).optional(),
    destLng: z.coerce.number().min(-180).max(180).optional(),
    destinationTown: z.string().trim().min(2).optional(),
    seats: z.coerce.number().int().min(1).max(6).default(1),
  })
  .refine(
    (d) => (d.destLat != null && d.destLng != null) || !!d.destinationTown,
    { message: "Provide destination coordinates (destLat/destLng) or destinationTown" },
  );

export const updateBookingStatusSchema = z.object({
  status: z.enum(["arrived", "in_progress", "completed"]),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(300, "Reason is too long").optional(),
});
