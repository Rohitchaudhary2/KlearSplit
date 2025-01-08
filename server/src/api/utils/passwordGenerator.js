import { randomBytes, randomInt } from "crypto";

// Generating random password for initaial password when user registers itself.
export const generatePassword = () => {
  const length = randomInt(8, 21);

  let password = randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);

  // Ensure at least one alphabet and one number are included
  while (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    password = randomBytes(Math.ceil(length / 2))
      .toString("hex")
      .slice(0, length);
  }

  return password;
};
