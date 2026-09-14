import bcrypt from "bcryptjs";
import crypto from "crypto";

export const generateOtp = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export const hashOtp = async (otp: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

export const verifyOtpHash = async (
  otp: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(otp, hash);
};
