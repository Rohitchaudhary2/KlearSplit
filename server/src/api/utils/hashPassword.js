import bcrypt from "bcryptjs";

export const hashedPassword = async(password) => {
  const salt = await bcrypt.genSalt(10);

  return await bcrypt.hash(password, salt);
};
