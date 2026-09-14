import { sendEmail } from "./email.config";

export const sendOtpEmail = async (
  email: string,
  name: string,
  otp: string,
) => {
  const subject = "Your Troski Verification Code";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${name},</h2>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code will expire in 10 minutes. Do not share it with anyone.</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendWelcomeEmail = async (
  email: string,
  name: string,
  role: "passenger" | "driver",
) => {
  const subject = "Welcome to Troski!";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome aboard, ${name}!</h2>
      <p>We are thrilled to have you join as a ${role}.</p>
      <p>Get ready for a seamless ride experience.</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

export const sendKycStatusEmail = async (
  email: string,
  name: string,
  status: "approved" | "rejected",
  reason?: string,
) => {
  const subject =
    status === "approved"
      ? "Troski KYC Approved"
      : "Action Required: Troski KYC Update";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${name},</h2>
      <p>Your driver profile verification status has been updated to: <strong>${status.toUpperCase()}</strong></p>
      ${status === "rejected" ? `<p><strong>Reason:</strong> ${reason}</p><p>Please log in to the Troski Driver app to update your details.</p>` : "<p>You are one step closer to hitting the road!</p>"}
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};

export const sendVehicleStatusEmail = async (
  email: string,
  name: string,
  plateNumber: string,
  status: "approved" | "rejected",
  reason?: string,
) => {
  const subject =
    status === "approved"
      ? "Troski Vehicle Approved"
      : "Action Required: Vehicle Verification Update";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${name},</h2>
      <p>The verification for your vehicle (<strong>${plateNumber}</strong>) has been updated to: <strong>${status.toUpperCase()}</strong></p>
      ${status === "rejected" ? `<p><strong>Reason:</strong> ${reason}</p><p>Please review your documents and submit again.</p>` : "<p>Your vehicle is now cleared for trips.</p>"}
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};
