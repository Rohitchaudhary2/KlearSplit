import crypto from "crypto";

export const otpGenrator = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};
