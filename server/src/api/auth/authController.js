import AuthService from "./authServices.js";
import { authResponseHandler } from "../utils/responseHandler.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";

// Controller for login funnctionality
export const login = async(req, res, next) => {
  try {
    const userData = await AuthService.login(req);

    authResponseHandler(res, 200, "User login successful", userData);
  } catch (err) {
    next(err);
  }
};

// Controller for logout functionality
export const logout = async(req, res, next) => {
  try {
    await AuthService.logout(req);
    res
      .status(200)
      .clearCookie("accessToken", { "httpOnly": true, "sameSite": "strict" })
      .clearCookie("refreshToken", { "httpOnly": true, "sameSite": "strict" })
      .json({
        "success": true,
        "message": "User logged out successfully"
      });
  } catch (err) {
    next(err);
  }
};

// Controller for Refresh Tokens
export const refreshToken = async(req, res, next) => {
  try {
    const { accessToken, newRefreshToken } = await AuthService.refreshToken(req);

    return res
      .cookie("accessToken", accessToken, {
        "httpOnly": true,
        "sameSite": "strict",
        "maxAge": 10 * 24 * 60 * 60 * 1000
      })
      .cookie("refreshToken", newRefreshToken, {
        "httpOnly": true,
        "sameSite": "strict",
        "maxAge": 10 * 24 * 60 * 60 * 1000
      })
      .send({ "message": "New Tokens generated successfully" });
  } catch (error) {
    // Handle errors related to refresh token expiration
    if (error.name === "TokenExpiredError") {
      return next(
        new ErrorHandler(401, "Access Denied. Refresh Token expired.")
      );
    }
    next(error);
  }
};
