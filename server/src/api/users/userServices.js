import { generatePassword } from "../utils/passwordGenerator.js";
import {
  createUserDb,
  getUserByIdDb,
  updateUserDb,
  deleteUserDb,
  getUserByEmailDb,
  restoreUserDb,
} from "./userDb.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import AuthService from "../auth/authServices.js";
import sequelize from "../../config/db.connection.js";
import { hashedPassword } from "../utils/hashPassword.js";
import sendMail from "../utils/sendMail.js";
import crypto from "crypto";
import { createOtpDb, getOtpDb } from "./otpDb.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";

class UserService {
  static verifyUser = async (user) => {
    const isUserExists = await getUserByEmailDb(user.email, false);

    // If email or phone already exists in database then checking whether user has deleted account
    if (isUserExists && isUserExists.dataValues.deletedAt)
      throw new ErrorHandler(400, "Looks like you had an account.");
    else if (isUserExists) throw new ErrorHandler(400, "Email already exists.");

    // send otp
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await createOtpDb({
      email: user.email,
      otp,
      otp_expiry_time: otpExpiresAt,
    });

    await sendMail(
      {
        email: user.email,
        subject: "Otp for sign up in KlearSplit",
      },
      "otpTemplate",
      {
        name: user.first_name,
        otp,
      },
    );
  };

  static createUser = async (user) => {
    const userOtp = user.otp;
    delete user.otp;

    const otp = await getOtpDb(user.email, userOtp);

    if (!otp) throw new ErrorHandler(400, "Invalid Otp.");

    if (new Date() >= otp.otp_expiry_time)
      throw new ErrorHandler(400, "Otp has been expired.");

    //Generating random password
    const password = generatePassword();

    //Hashing the password
    user.password = await hashedPassword(password);

    const transaction = await sequelize.transaction(); // Starting a new transaction

    try {
      // Creating new user in the database
      const createdUser = await createUserDb(user, transaction);
      // }

      // Generate access and refresh tokens
      const accessToken = generateAccessToken(createdUser.user_id);
      if (!accessToken)
        throw new ErrorHandler(500, "Error while genrating access token.");
      const refreshToken = generateRefreshToken(createdUser.user_id);
      if (!refreshToken)
        throw new ErrorHandler(500, "Error while genrating Refresh token.");

      // Store the refresh token in the database
      await AuthService.createRefreshToken(
        {
          token: refreshToken,
          user_id: createdUser.user_id,
        },
        transaction,
      );

      // Commit the transaction
      await transaction.commit();

      const options = {
        email: user.email,
        subject: "Password for Sign in for KlearSplit",
      };

      sendMail(options, "passwordTemplate", {
        name: user.first_name,
        email: user.email,
        password,
      });

      return { user: createdUser, accessToken, refreshToken };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  };

  static verifyRestoreUser = async (user) => {
    const isEmailExists = await getUserByEmailDb(user.email, false);

    if (!isEmailExists) {
      throw new ErrorHandler(
        400,
        "No Record found. Please Create new account.",
      );
    } else if (
      isEmailExists &&
      isEmailExists.dataValues &&
      !isEmailExists.dataValues.deletedAt
    ) {
      throw new ErrorHandler(400, "Account already exists for this Email.");
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await createOtpDb({
      email: user.email,
      otp,
      otp_expiry_time: otpExpiresAt,
    });

    await sendMail(
      {
        email: user.email,
        subject: "Otp for sign up in KlearSplit",
      },
      "otpTemplate",
      {
        name: isEmailExists.dataValues.first_name,
        otp,
      },
    );
  };

  static restoreUser = async (user) => {
    const isEmailExists = await getUserByEmailDb(user.email, false);
    if (!isEmailExists) throw new ErrorHandler(400, "User not found");
    if (!isEmailExists.dataValues.deletedAt)
      throw new ErrorHandler(400, "Account for this Email is active.");

    const otp = await getOtpDb(user.email, user.otp);

    if (!otp) throw new ErrorHandler(400, "Invalid Otp.");

    if (new Date() >= otp.otp_expiry_time)
      throw new ErrorHandler(400, "Otp has been expired.");

    //Generating random password
    const password = generatePassword();

    //Hashing the password
    user.password = await hashedPassword(password);

    const transaction = await sequelize.transaction(); // Starting a new transaction

    try {
      // Restoring user in the database
      await restoreUserDb(user.email, transaction);
      const restoredUser = isEmailExists.dataValues;

      // Generate access and refresh tokens
      const accessToken = generateAccessToken(restoredUser.user_id);
      const refreshToken = generateRefreshToken(restoredUser.user_id);

      // Store the refresh token in the database
      await AuthService.createRefreshToken(
        {
          token: refreshToken,
          user_id: restoredUser.user_id,
        },
        transaction,
      );

      await updateUserDb(
        { password: user.password },
        restoredUser.user_id,
        transaction,
      );

      // Commit the transaction
      await transaction.commit();

      const options = {
        email: user.email,
        subject: "Password for Sign in for KlearSplit",
      };

      sendMail(options, "passwordTemplate", {
        name: restoredUser.first_name,
        email: user.email,
        password,
      });

      return { user: restoredUser, accessToken, refreshToken };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  };

  static forgotPassword = async (email) => {
    const user = await getUserByEmailDb(email);
    if (!user) throw new ErrorHandler(400, "Email does not exist");

    const password = generatePassword();
    const hashPassword = await hashedPassword(password);

    await updateUserDb({ password: hashPassword }, user.user_id);

    const options = {
      email: user.email,
      subject: "Password for Sign in for KlearSplit",
    };

    sendMail(options, "passwordTemplate", {
      name: user.first_name,
      email: user.email,
      password,
    });
  };

  // Service to get user from database
  static getUser = async (id) => {
    const user = await getUserByIdDb(id);
    if (!user) throw new ErrorHandler(404, "User not found.");
    return user;
  };

  // Service for updating user in the database
  static updateUser = async (req) => {
    const user = req.validatedUser;
    const id = req.params.id;
    await this.getUser(id);

    return await updateUserDb(user, id);
  };

  // Service for deleting user in the database
  static deleteUser = async (req) => {
    const id = req.params.id;
    await this.getUser(id);

    return await deleteUserDb(id);
  };
}

export default UserService;
