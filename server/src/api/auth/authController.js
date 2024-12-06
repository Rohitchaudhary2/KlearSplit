import AuthService from "./authServices.js";
import { authResponseHandler } from "../utils/responseHandler.js";
import asyncHandler from "../utils/asyncHandler.js";

// Controller for login funnctionality
export const login = asyncHandler(async(req, res) => {
  const userData = await AuthService.login(req);
  
  return authResponseHandler(res, 200, "User login successful", userData);
});

// Controller for logout functionality
export const logout = asyncHandler(async(req, res) => {
  await AuthService.logout(req);
  res
    .status(200)
    .clearCookie("accessToken", { "httpOnly": true, "sameSite": "strict" })
    .clearCookie("refreshToken", { "httpOnly": true, "sameSite": "strict" })
    .json({
      "success": true,
      "message": "User logged out successfully"
    });
});

// Controller for Refresh Tokens
export const refreshToken = asyncHandler(async(req, res) => {
  const { accessToken, newRefreshToken } = await AuthService.refreshToken(req);

  res
    .cookie("accessToken", accessToken, {
      "httpOnly": true,
      "sameSite": "strict",
      "maxAge": 10 * 24 * 60 * 60 * 1000 // 10 days
    })
    .cookie("refreshToken", newRefreshToken, {
      "httpOnly": true,
      "sameSite": "strict",
      "maxAge": 10 * 24 * 60 * 60 * 1000 // 10 days
    })
    .send({ "message": "New Tokens generated successfully" });
});
