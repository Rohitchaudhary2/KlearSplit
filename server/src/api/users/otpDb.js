import Otp from "./models/otpModel.js";

export const createOtpDb = async (otp) => await Otp.create(otp);

export const getOtpDb = async (email, otp) =>
  await Otp.findOne({
    where: {
      email,
      otp,
    },
  });
