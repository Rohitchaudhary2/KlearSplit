import jwt from "jsonwebtoken";
import { ErrorHandler } from "../middlewares/errorHandler.js";

export const generateAccessAndRefereshTokens = (id) => {
  const accessToken = generateAccessToken(id);
  if (!accessToken)
    throw new ErrorHandler(500, "Error while generating access token.");
  const refreshToken = generateRefreshToken(id);
  if (!refreshToken)
    throw new ErrorHandler(500, "Error while generating Refresh token.");
};

// Function to generate a new access token using the provided user_id
export const generateAccessToken = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_SECRET_KEY, {
    expiresIn: process.env.ACCESS_EXPIRY,
  });

  if (!accessToken)
    throw new ErrorHandler(500, "Error while generating access token");

  return accessToken;
};

// Function to generate a new access token using the provided user_id
export const generateRefreshToken = (id) => {
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_SECRET_KEY, {
    expiresIn: process.env.REFRESH_EXPIRY,
  });

  if (!refreshToken)
    throw new ErrorHandler(500, "Error while generating refresh token");
  return refreshToken;
};
