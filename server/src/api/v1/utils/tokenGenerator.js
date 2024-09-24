import jwt from "jsonwebtoken";
import { ErrorHandler } from "../middlewares/ErrorHandler.js";

export const generateAccessToken = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_SECRET_KEY, {
    expiresIn: process.env.ACCESS_EXPIRY,
  });

  if (!accessToken)
    throw new ErrorHandler(500, "Error while generating access Token ");

  return accessToken;
};

export const generateRefreshToken = (id) => {
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_SECRET_KEY, {
    expiresIn: process.env.REFRESH_EXPIRY,
  });

  if (!refreshToken)
    throw new ErrorHandler(500, "Error while generating refresh Token");

  return refreshToken;
};
