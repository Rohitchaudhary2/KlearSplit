import jwt from "jsonwebtoken";
import { ErrorHandler } from "./errorHandler.js";
import UserService from "../users/userServices.js";

// Middleware for authenticating user
export const authenticateToken = async(req, res, next) => {
  try {
    if (!req.cookies.accessToken) {
      throw new ErrorHandler(401, "Access Denied. No Access token provided.");
    }

    const accessToken = req.cookies.accessToken;

    // Verify the access token
    const user = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY);

    req.user = await UserService.getUser(user.id, next);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // If access token expired, attempt to use refresh token
      next(new ErrorHandler(401, "Token expired"));
    } else {
      next(error);
    }
  }
};
