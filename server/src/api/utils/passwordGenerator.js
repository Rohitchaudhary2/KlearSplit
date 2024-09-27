import { randomBytes } from "crypto";

// Generating random password for initaial password when user registers itself.
export const generatePassword = () => {
  const length = Math.floor(Math.random() * 9) + 8;

  const password = randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);

  return password;
};
