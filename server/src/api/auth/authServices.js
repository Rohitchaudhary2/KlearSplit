import bcrypt from "bcryptjs";
import UserDb from "../users/userDb.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";
import { generateAccessAndRefereshTokens } from "../utils/tokenGenerator.js";
import sendMail from "../utils/sendMail.js";
import Redis from "ioredis";
import jwt from "jsonwebtoken";
import UserService from "../users/userServices.js";

const redis = new Redis();

class AuthService {
  // Service for handling login functionality
  static login = async(req) => {
    const { email, password } = req.body;

    // Checking whether the email is correct
    const user = await UserDb.getUserByEmail(email, false);

    if (!user) {
      throw new ErrorHandler(404, "Email or Password is wrong.");
    } else if (user && user.dataValues.deletedAt) {
      throw new ErrorHandler(
        400,
        "Looks like you had an account. Please restore it."
      );
    }
  
    const failedAttemptsKey = `failedAttempts:${email}`;

    let failedAttempts = (await redis.get(failedAttemptsKey)) || 0;

    failedAttempts = parseInt(failedAttempts);
    if (failedAttempts >= 3) {
      throw new ErrorHandler(
        403,
        "Your account is temporarily unavailable. Please follow the instructions sent to your registered email."
      );
    }

    const validPassword = await bcrypt.compare(
      password,
      user.dataValues.password
    );

    if (!validPassword) {
      failedAttempts += 1;

      if (failedAttempts >= 3) {
        const options = {
          email,
          "subject": "Important: Your Account Has Been Temporarily Locked"
        };

        sendMail(options, "accountBlock", {
          "name": user.dataValues.first_name,
          email,
          "lockoutDuration": "15 minutes"
        });
        await redis.setex(failedAttemptsKey, 900, failedAttempts);
        throw new ErrorHandler(
          404,
          "Your account has been temporarily blocked due to multiple unsuccessful login attempts."
        );
      }
      await redis.setex(failedAttemptsKey, 900, failedAttempts);
      throw new ErrorHandler(404, "Email or Password is wrong.");
    } else {
      await redis.del(failedAttemptsKey);
    }

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = generateAccessAndRefereshTokens(
      user.user_id
    );

    // Storing refresh token in the database
    await this.createRefreshToken(refreshToken, user.email);

    return { user, accessToken, refreshToken };
  };

  // Service for handling logout functionality
  static logout = async(req) => {
    // Deleting the refresh token from the database when user log out
    await this.deleteRefreshToken(req.user.email);
  };

  // Service for handling refresh token functionality when access token expires
  static refreshToken = async(req) => {
    if (!req.cookies.refreshToken) {
      throw new ErrorHandler(401, "Access Denied. No Refresh Token provided.");
    }

    const refreshToken = req.cookies.refreshToken;

    // Verify the refresh token
    const userId = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

    req.user = await UserService.getUser(userId.id);
    
    // Check if the refresh token exists in the database
    const refreshTokenDb = await this.getRefreshToken(req.user.email);

    if (!refreshTokenDb) {
      throw new ErrorHandler(401, "Access Denied. Invalid Token");
    }

    // Generate access and refresh tokens
    const { accessToken, "refreshToken": newRefreshToken } = generateAccessAndRefereshTokens(userId.id);

    await this.createRefreshToken(newRefreshToken, req.user.email);
    return { accessToken, newRefreshToken };
  };

  // Service for creating refresh token
  static createRefreshToken = async(refreshToken, email) => {
    // Storing refresh token in the datbase
    await redis.setex(
      `refreshToken:${email}`,
      process.env.REFRESH_EXPIRY_IN_SECONDS,
      refreshToken
    );
  };

  // Service to get refresh token from the database
  static getRefreshToken = async(email) =>
    await redis.get(`refreshToken:${email}`);

  // Service for deleting refresh token from the database
  static deleteRefreshToken = async(email) => {
    await redis.del(`refreshToken:${email}`);
  };
}

export default AuthService;
