import { sendSms } from "./sms.config";

export const sendOtpSms = async (phoneNumber: string, otp: string) => {
  const message = `Your Troski verification code is ${otp}. It expires in 10 minutes. Do not share this code.`;
  return sendSms({ recipients: [phoneNumber], message });
};

export const sendWelcomeSms = async (
  phoneNumber: string,
  role: "passenger" | "driver",
) => {
  const message = `Welcome to Troski! We're excited to have you on board as a ${role}.`;
  return sendSms({ recipients: [phoneNumber], message });
};
