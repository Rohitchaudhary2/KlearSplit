import jwt from "jsonwebtoken";
import AuthService from "../auth/authServices.js";
import { generateAccessAndRefereshTokens } from "../utils/tokenGenerator.js";
import { ErrorHandler } from "./errorHandler.js";
import UserService from "../users/userServices.js";
import sequelize from "../../config/db.connection.js";

const handleAccessToken = (req) => {
  if (!req.cookies["accessToken"]) {
    throw new ErrorHandler(401, "Access Denied. No Access token provided.");
  }

  const accessToken = req.cookies["accessToken"];
  if (!accessToken)
    throw new ErrorHandler(401, "Access Denied. No Access Token provided.");

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
      throw new ErrorHandler(401, "Access Denied. Invalid Token");

    // Generate access and refresh tokens
    const { accessToken, refreshToken: newRefreshToken } =
      generateAccessAndRefereshTokens(userId.id);

    const transaction = await sequelize.transaction();
    await AuthService.createRefreshToken(
      {
        token: newRefreshToken,
        user_id: userId.id,
      },
      transaction,
    );

    // Commit the transaction
    await transaction.commit();

    await AuthService.deleteRefreshToken(refreshToken);

    req.user = await UserService.getUser(userId.id, next);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 10 * 24 * 60 * 60 * 1000,
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 10 * 24 * 60 * 60 * 1000,
      });
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
  try {
    const accessToken = handleAccessToken(req);
    // Verify the access token
    const user = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY);
    req.user = await UserService.getUser(user.id, next);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // If access token expired, attempt to use refresh token
      handleRefreshToken(req, res, next);
    } else {
      next(error);
    }
  }
};
