import jwt from "jsonwebtoken";
import AuthService from "../auth/authServices.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import { ErrorHandler } from "./ErrorHandler.js";
import UserService from "../users/userServices.js";
import sequelize from "../../../config/db.connection.js";

// Middleware to check access and refresh token's authenticity and expiry
export const authenticateToken = async (req, res, next) => {
  // Checking if there's no authorization header and no refresh token in cookies
  if (!req.headers["authorization"] && !req.cookies["refreshToken"]) {
    throw next(new ErrorHandler(401, "Access Denied. No token provided."));
  }

  try {
    const accessToken = req.headers["authorization"]?.split(" ")[1];
    if (!accessToken)
      return next(
        new ErrorHandler(401, "Access Denied. No Access Token provided."),
      );

    // Verify the access token
    const user = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY);
    req.user = await UserService.getUserService(user.id);
    next();
  } catch (error) {
    if (error.name !== "TokenExpiredError") {
      return next(
        new ErrorHandler(401, "Access Denied. Invalid Access Token."),
      );
    }

    // If access token expired, attempt to use refresh token
    const refreshToken = req.cookies["refreshToken"];
    if (!refreshToken)
      throw next(
        new ErrorHandler(401, "Access Denied. No Refresh Token provided."),
      );

    try {
      // Verify the refresh token
      const userId = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

      // Check if the refresh token exists in the database
      const refreshTokenDb =
        await AuthService.getRefreshTokenService(refreshToken);
      if (!refreshTokenDb)
        throw next(new ErrorHandler(401, "Access Denied. Invalid Token"));

      // Generate new access and refresh tokens
      const accessToken = generateAccessToken(userId.id);
      const newRefreshToken = generateRefreshToken(userId.id);

      const transaction = await sequelize.transaction();
      await AuthService.createRefreshTokenService(newRefreshToken, transaction);

      req.user = await UserService.getUserService(userId.id);

      res
        .cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          sameSite: "strict",
        })
        .set("Authorization", accessToken);
      next();
    } catch (error) {
      // Handle errors related to refresh token expiration
      if (error.name === "TokenExpiredError") {
        return next(
          new ErrorHandler(401, "Access Denied. Refresh Token expired."),
        );
      } else next(error);
    }
  }
};
