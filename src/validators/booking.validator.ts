import { z } from "zod";

export const estimateFareSchema = z.object({
  pickupLatitude: z.coerce.number().min(-90).max(90, "Invalid pickup latitude"),
  pickupLongitude: z.coerce
    .number()
    .min(-180)
    .max(180, "Invalid pickup longitude"),
  dropoffLatitude: z.coerce
    .number()
    .min(-90)
    .max(90, "Invalid dropoff latitude"),
  dropoffLongitude: z.coerce
    .number()
    .min(-180)
    .max(180, "Invalid dropoff longitude"),
  seats: z.coerce.number().int().min(1).max(6).default(1),
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
    paymentMethod: z.enum(["cash", "momo"], {
      error: "Payment method must be either 'cash' or 'momo'",
    }),
  })
  .refine(
    (d) => (d.destLat != null && d.destLng != null) || !!d.destinationTown,
    {
      message:
        "Provide destination coordinates (destLat/destLng) or destinationTown",
    },
  );

export const updateBookingStatusSchema = z.object({
  status: z.enum(["arrived", "in_progress", "completed"]),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(300, "Reason is too long").optional(),
});
