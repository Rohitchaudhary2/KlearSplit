import crypto from "crypto";

export const otpGenrator = () => {
  return crypto.randomInt(100000, 999999).toString();
};
