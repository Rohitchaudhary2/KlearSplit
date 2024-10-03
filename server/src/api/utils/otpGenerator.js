import crypto from "crypto";

export const otpGenrator = async () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  return { otp, otpExpiresAt };
};
