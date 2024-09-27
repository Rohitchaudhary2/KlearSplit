import jwt from "jsonwebtoken";
import { ErrorHandler } from "../middlewares/errorHandler.js";

// Function to generate a new access token using the provided user_id
export const generateAccessToken = (id, next) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_SECRET_KEY, {
    expiresIn: process.env.ACCESS_EXPIRY,
  });

  if (!accessToken)
    return next(new ErrorHandler(500, "Error while generating access Token "));

  return accessToken;
};

// Function to generate a new access token using the provided user_id
export const generateRefreshToken = (id, next) => {
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_SECRET_KEY, {
    expiresIn: process.env.REFRESH_EXPIRY,
  });

  if (!refreshToken)
    return next(new ErrorHandler(500, "Error while generating refresh Token"));

  return refreshToken;
};
