import jwt from "jsonwebtoken";
import AuthService from "../auth/authServices.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import { ErrorHandler } from "./errorHandler.js";
import UserService from "../users/userServices.js";
import sequelize from "../../config/db.connection.js";

const handleAccessToken = (req, next) => {
  if (!req.headers["authorization"]) {
    return next(
      new ErrorHandler(401, "Access Denied. No Access token provided."),
    );
  }

  const accessToken = req.headers["authorization"].split(" ")[1];
  if (!accessToken)
    return next(
      new ErrorHandler(401, "Access Denied. No Access Token provided."),
    );

  return accessToken;
};

const handleRefreshToken = async (req, res, next) => {
  const refreshToken = req.cookies["refreshToken"];
  if (!refreshToken)
    return next(
      new ErrorHandler(401, "Access Denied. No Refresh Token provided."),
    );

  try {
    // Verify the refresh token
    const userId = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

    // Check if the refresh token exists in the database
    const refreshTokenDb = await AuthService.getRefreshToken(refreshToken);
    if (!refreshTokenDb)
      return next(new ErrorHandler(401, "Access Denied. Invalid Token"));

    // Generate new access and refresh tokens
    const accessToken = generateAccessToken(userId.id, next);
    const newRefreshToken = generateRefreshToken(userId.id, next);

    const transaction = await sequelize.transaction();
    await AuthService.createRefreshToken(
      {
        token: newRefreshToken,
        user_id: userId.id,
      },
      transaction,
      next,
    );

    // Commit the transaction
    await transaction.commit();

    await AuthService.deleteRefreshToken(refreshToken, next);

    req.user = await UserService.getUser(userId.id, next);

    res
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "strict",
      })
      .set("Authorization", `Bearer ${accessToken}`);
    return next();
  } catch (error) {
    // Handle errors related to refresh token expiration
    if (error.name === "TokenExpiredError") {
      return next(
        new ErrorHandler(401, "Access Denied. Refresh Token expired."),
      );
    } else {
      next(error);
    }
  }
};

// Middleware to check access and refresh token's authenticity and expiry
export const authenticateToken = async (req, res, next) => {
  const accessToken = handleAccessToken(req, next);

  try {
    // Verify the access token
    const user = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY);
    req.user = await UserService.getUser(user.id, next);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // If access token expired, attempt to use refresh token
      handleRefreshToken(req, res, next);
    } else {
      return next(error);
    }
  }
};
