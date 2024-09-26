import Otp from "./models/otpModel.js";

export const createOtpDb = async (otp) => await Otp.create(otp);

export const getOtpDb = async (email, phone) =>
  await Otp.findOne({
    where: {
      email,
      phone,
    },
  });
