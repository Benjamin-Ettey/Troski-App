import { z } from "zod";

export const updateDriverStatusSchema = z
  .object({
    status: z.enum(["approved", "rejected", "suspended"]),
    rejectionReason: z.string().optional(),
  })
  .refine(
    (data) =>
      data.status === "rejected" || data.status === "suspended"
        ? !!data.rejectionReason
        : true,
    {
      message: "Reason is required when rejecting or suspending",
      path: ["rejectionReason"],
    },
  );

export const updateVehicleStatusSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    rejectionReason: z.string().optional(),
  })
  .refine(
    (data) => (data.status === "rejected" ? !!data.rejectionReason : true),
    { message: "Reason is required when rejecting", path: ["rejectionReason"] },
  );
