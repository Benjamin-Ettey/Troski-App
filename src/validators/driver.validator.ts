import { z } from "zod";

export const submitKycSchema = z.object({
  ghanaCardNumber: z
    .string()
    .regex(
      /^GHA-\d{9}-\d$/,
      "Invalid Ghana Card format (e.g., GHA-000000000-0)",
    ),
  licenseNumber: z
    .string()
    .trim()
    .min(5, "License number is too short")
    .max(20, "License number is too long")
    .regex(
      /^[A-Z0-9][A-Z0-9 -]*$/i,
      "Invalid license number. e.g. DL-230914-A8, GHA 0094123 B, W09124567",
    ),
  licenseExpiryDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format")
    .refine(
      (date) => new Date(date) > new Date(),
      "License expiry date must be in the future",
    ),
  momoNumber: z.string().min(10, "Valid Mobile Money number is required"),
  routePreferences: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) && parsed.every((p) => p.from && p.to);
      } catch {
        return false;
      }
    }, "routePreferences must be a valid JSON string array of { from, to } objects"),
});

export const submitVehicleSchema = z.object({
  vehicleMake: z
    .string()
    .min(2, "Vehicle make is required"),
  plateNumber: z
    .string()
    .trim()
    .regex(
      /^(?:[A-Z]{2}[- ]?\d{4}[- ]?\d{2}|[A-Z]{2}[- ]?\d{1,4}[- ]?[A-Z]{2})$/i,
      "Invalid Ghana vehicle plate number",
    ),
  vehicleColor: z.string().min(2, "Vehicle color is required"),
  vehicleCapacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
});
