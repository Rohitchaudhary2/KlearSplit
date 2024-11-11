import AuthService from "./authServices.js";
import { authResponseHandler } from "../utils/responseHandler.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";
import jwt from "jsonwebtoken";
import { generateAccessAndRefereshTokens } from "../utils/tokenGenerator.js";
import UserService from "../users/userServices.js";

// Controller for login funnctionality
export const login = async (req, res, next) => {
  try {
    const userData = await AuthService.login(req);
    authResponseHandler(res, 200, "User login successful", userData);
  } catch (err) {
    next(err);
  }
};

// Controller for logout functionality
export const logout = async (req, res, next) => {
  try {
    await AuthService.logout(req);
    res
      .status(200)
      .clearCookie("accessToken", { httpOnly: true, sameSite: "strict" })
      .clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" })
      .json({
        success: false,
        message: "User logged out successfully",
      });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  if (!req.cookies["refreshToken"])
    return next(
      new ErrorHandler(401, "Access Denied. No Refresh Token provided."),
    );

  const refreshToken = req.cookies["refreshToken"];

  try {
    // Verify the refresh token
    const userId = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

    req.user = await UserService.getUser(userId.id, next);

    // Check if the refresh token exists in the database
    const refreshTokenDb = await AuthService.getRefreshToken(req.user.email);
    if (!refreshTokenDb)
      throw new ErrorHandler(401, "Access Denied. Invalid Token");

    // Generate access and refresh tokens
    const { accessToken, refreshToken: newRefreshToken } =
      generateAccessAndRefereshTokens(userId.id);

    await AuthService.createRefreshToken(newRefreshToken, req.user.email);

    return res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 10 * 24 * 60 * 60 * 1000,
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 10 * 24 * 60 * 60 * 1000,
      })
      .send({ message: "New Tokens generated successfully" });
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
