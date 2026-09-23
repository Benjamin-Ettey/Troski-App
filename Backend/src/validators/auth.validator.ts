import { z } from "zod";

const pinSchema = z
  .string()
  .length(6, "PIN must be exactly 6 digits")
  .regex(/^\d+$/, "PIN must contain only numbers");
const phoneSchema = z.string().min(10, "Invalid phone number");

export const registerPassengerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Invalid email address"),
  phoneNumber: phoneSchema,
  pin: pinSchema,
  otpCode: z.string().length(6, "OTP must be 6 digits"),
  deliveryMethod: z.enum(["sms", "email"]).default("sms"),
});

export const registerDriverSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Invalid email address"),
  phoneNumber: phoneSchema,
  pin: pinSchema,
  otpCode: z.string().length(6, "OTP must be 6 digits"),
  deliveryMethod: z.enum(["sms", "email"]).default("sms"),
});

// Validates the initial SMS request
export const requestSmsOtpSchema = z.object({
  phoneNumber: phoneSchema,
});

// Validates the fallback email request
export const requestEmailOtpSchema = z.object({
  email: z.email("Valid email required"),
  name: z.string().min(2, "Name is required"),
});

export const verifyOtpSchema = z.object({
  phoneNumber: phoneSchema,
  otp: z.string().length(6, "OTP must be 6 digits"),
  purpose: z.enum([
    "signup",
    "login",
    "reset_pin",
    "change_phone",
    "sensitive_transaction",
  ]),
});

export const loginSchema = z.object({
  phoneNumber: phoneSchema,
  pin: pinSchema,
});

export const registerAdminSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Invalid email address"),
  adminId: z.string().min(4, "Admin ID must be at least 4 characters long"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const loginAdminSchema = z.object({
  adminId: z.string().min(1, "Admin ID is required"),
  password: z.string().min(1, "Password is required"),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
  role: z.enum(["passenger", "driver"]).optional(),
  phoneNumber: z.string().optional(),
});
