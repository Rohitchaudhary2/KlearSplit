import { randomBytes, randomInt } from "crypto";

// Generating random password for initaial password when user registers itself.
export const generatePassword = () => {
  const length = randomInt(8, 21);

  const password = randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);

  return password;
};
