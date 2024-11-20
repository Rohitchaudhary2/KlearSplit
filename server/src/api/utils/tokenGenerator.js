import jwt from "jsonwebtoken";
import { ErrorHandler } from "../middlewares/errorHandler.js";

/**
 * Generates a new access token for the given user ID.
 * The access token is signed using a secret key and is set to expire after a certain period.
 * @param {string} id - The user ID for which the access token will be generated.
 * @returns {string} - The generated access token.
 * @throws {ErrorHandler} - Throws an error if the token could not be generated.
 */
export const generateAccessToken = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_SECRET_KEY, {
    "expiresIn": process.env.ACCESS_EXPIRY
  });

  if (!accessToken) {
    throw new ErrorHandler(500, "Error while generating access token");
  }
  
  return accessToken;
};

/**
 * Generates a new refresh token for the given user ID.
 * The refresh token is signed using a different secret key and has a longer expiry period.
 * @param {string} id - The user ID for which the refresh token will be generated.
 * @returns {string} - The generated refresh token.
 * @throws {ErrorHandler} - Throws an error if the token could not be generated.
 */
export const generateRefreshToken = (id) => {
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_SECRET_KEY, {
    "expiresIn": process.env.REFRESH_EXPIRY
  });

  if (!refreshToken) {
    throw new ErrorHandler(500, "Error while generating refresh token");
  }
    
  return refreshToken;
};

/**
 * Generates both an access token and a refresh token for a user based on their user ID.
 * @param {string} id - The user ID for which the tokens will be generated.
 * @returns {Object} - An object containing both the generated access token and refresh token.
 * @throws {ErrorHandler} - Throws an error if there is a problem generating either token.
 */
export const generateAccessAndRefereshTokens = (id) => {
  const accessToken = generateAccessToken(id);

  if (!accessToken) {
    throw new ErrorHandler(500, "Error while generating access token.");
  }
    
  const refreshToken = generateRefreshToken(id);

  if (!refreshToken) {
    throw new ErrorHandler(500, "Error while generating Refresh token.");
  }
    
  return { accessToken, refreshToken };
};
