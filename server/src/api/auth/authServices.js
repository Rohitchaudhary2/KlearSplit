import bcrypt from "bcryptjs";
import UserDb from "../users/userDb.js";
import {
  createRefreshTokenDb,
  deleteRefreshTokenDb,
  getRefreshTokenDb,
} from "./tokenDb.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";
import { generateAccessAndRefereshTokens } from "../utils/tokenGenerator.js";
import sendMail from "../utils/sendMail.js";

class AuthService {
  // Service for handling login functionality
  static login = async (req) => {
    const { email, password } = req.body;

    // Checking whether the email is correct
    const user = await UserDb.getUserByEmail(email, false);
    if (!user) throw new ErrorHandler(404, "Email or Password is wrong.");
    else if (user && user.dataValues.deletedAt)
      throw new ErrorHandler(
        400,
        "Looks like you had an account. Please restore it.",
      );

    const currentTime = new Date();
    if (user.lockoutUntil && user.lockoutUntil > currentTime) {
      throw new ErrorHandler(
        403,
        "Your account is temporarily unavailable. Please follow the instructions sent to your registered email.",
      );
    }
    // checking whether password is valid
    const validPassword = await bcrypt.compare(
      password,
      user.dataValues.password,
    );
    if (!validPassword) {
      user.failedAttempts += 1;

      if (user.failedAttempts >= 3) {
        user.failedAttempts = 0;
        user.lockoutUntil = new Date(Date.now() + 900000); // lock for 15 minutes
        const options = {
          email,
          subject: "Important: Your Account Has Been Temporarily Locked",
        };
        await sendMail(options, "accountBlock", {
          name: user.dataValues.first_name,
          email,
          lockoutDuration: "15 minutes",
        });
        await UserDb.updateUser(
          {
            failedAttempts: user.failedAttempts,
            lockoutUntil: user.lockoutUntil,
          },
          user.user_id,
        );
        throw new ErrorHandler(
          404,
          "Your account has been temporarily blocked due to multiple unsuccessful login attempts.",
        );
      }
      await UserDb.updateUser(
        {
          failedAttempts: user.failedAttempts,
          lockoutUntil: user.lockoutUntil,
        },
        user.user_id,
      );
      throw new ErrorHandler(404, "Email or Password is wrong.");
    } else {
      user.failedAttempts = 0;
      user.lockoutUntil = null;
    }

    await UserDb.updateUser(
      { failedAttempts: user.failedAttempts, lockoutUntil: user.lockoutUntil },
      user.user_id,
    );

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = generateAccessAndRefereshTokens(
      user.user_id,
    );

    // Storing refresh token in the database
    this.createRefreshToken({
      token: refreshToken,
      user_id: user.user_id,
    });

    return { user, accessToken, refreshToken };
  };

  // Service for handling logout functionality
  static logout = async (req) => {
    const refreshToken = req.cookies["refreshToken"];

    // Deleting the refresh token from the database when user log out
    const isDeleted = await deleteRefreshTokenDb(refreshToken);

    return isDeleted;
  };

  // Service for creating refresh token
  static createRefreshToken = async (refreshToken, transaction) => {
    // Storing refresh token in the datbase
    const createdRefreshToken = await createRefreshTokenDb(
      refreshToken,
      transaction,
    );
    if (!createdRefreshToken)
      throw new ErrorHandler(500, "Error while generating refresh token");
    return createdRefreshToken;
  };

  // Service to get refresh token from the database
  static getRefreshToken = async (req) => await getRefreshTokenDb(req);

  static deleteRefreshToken = async (req) => {
    const isDeleted = await deleteRefreshTokenDb(req);
    if (!isDeleted)
      throw new ErrorHandler(503, "Error while deleting refresh token");
  };
}

export default AuthService;
