import AuthService from "./authServices.js";
import { authResponseHandler } from "../utils/responseHandler.js";

// Controller for login funnctionality
export const loginController = async (req, res, next) => {
  try {
    const userData = await AuthService.login(req);
    authResponseHandler(res, 200, "User login successful", userData);
  } catch (err) {
    next(err);
  }
};

// Controller for logout functionality
export const logoutController = async (req, res, next) => {
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
