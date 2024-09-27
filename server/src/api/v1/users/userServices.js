import { generatePassword } from "../utils/passwordGenerator.js";
import {
  createUserDb,
  getUserByIdDb,
  updateUserDb,
  deleteUserDb,
  getUserByEmailDb,
  getUserByPhoneDb,
  restoreUserDb,
} from "./userDb.js";
import { validateUpdatedUser, validateUser } from "./userValidations.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import AuthService from "../auth/authServices.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";
import sequelize from "../../../config/db.connection.js";
import { hashedPassword } from "../utils/hashPassword.js";
import sendMail from "../utils/sendMail.js";
import crypto from "crypto";
import { createOtpDb, getOtpDb } from "./otpDb.js";

class UserService {
  static verifyUser = async (userData, next) => {
    // Validating and sanitizing the user data with JOI validator
    const { error, value: user } = validateUser(userData, {
      stripUnknown: true,
    });
    if (error) throw next(new ErrorHandler(400, error.message));

    // Restore flag to indicate whether the user has deleted his/her account previously
    let restoreFlag = false;

    const isEmailExists = await getUserByEmailDb(user.email, false);
    // If email already exists in database then checking whether user has deleted account
    if (isEmailExists && isEmailExists.dataValues.deletedAt) {
      restoreFlag = true;
    } else if (isEmailExists)
      throw next(new ErrorHandler(400, "Email already exists!"));

    // Checking whether phone number exists in database if so then checking whether we are restoring user.
    const isPhoneExists = await getUserByPhoneDb(user.phone);
    if (isPhoneExists && !restoreFlag)
      throw next(new ErrorHandler(400, "Phone Number already exists!"));

    // send otp
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await createOtpDb({
      email: user.email,
      phone: user.phone,
      otp,
      otp_expiry_time: otpExpiresAt,
    });

    sendMail({
      email: user.email,
      subject: "Otp",
      message: `This is your ${otp} for sign up in KlearSplit. It is valid for 5 minutes.`,
    });
  };

  static createUser = async (userData, next) => {
    const userOtp = userData.otp;
    delete userData.otp;
    // Validating and sanitizing the user data with JOI validator
    const { error, value: user } = validateUser(userData, {
      stripUnknown: true,
    });
    if (error) throw next(new ErrorHandler(400, error.message));

    // Restore flag to indicate whether the user has deleted his/her account previously
    let restoreFlag = false;

    const isEmailExists = await getUserByEmailDb(user.email, false);
    if (isEmailExists && isEmailExists.dataValues.deletedAt) {
      restoreFlag = true;
    }

    const otp = await getOtpDb(user.email, user.phone, userOtp);

    if (!otp) throw next(new ErrorHandler(400, "Invalid Otp."));

    if (new Date() >= otp.otp_expiry_time)
      throw next(new ErrorHandler(400, "Otp has expired."));

    //Generating random password
    const password = generatePassword();

    //Hashing the password
    user.password = await hashedPassword(password);

    const transaction = await sequelize.transaction(); // Starting a new transaction

    try {
      let createdUser;
      if (restoreFlag) {
        // Restoring user in the database
        await restoreUserDb(user.email, transaction);
        createdUser = isEmailExists.dataValues;
      } else {
        // Creating new user in the database
        createdUser = await createUserDb(user, transaction);
      }

      // Generate access and refresh tokens
      const accessToken = generateAccessToken(createdUser.user_id, next);
      const refreshToken = generateRefreshToken(createdUser.user_id, next);

      // Store the refresh token in the database
      await AuthService.createRefreshToken(
        {
          token: refreshToken,
          user_id: createdUser.user_id,
          next,
        },
        transaction,
      );

      // Commit the transaction
      await transaction.commit();

      const options = {
        email: user.email,
        subject: "Password",
        message: `This is your password ${password} for signing in KlearSplit.`,
      };

      sendMail(options);

      return { user: createdUser, accessToken, refreshToken };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  };

  // Service to get user from database
  static getUser = async (id, next) => {
    const user = await getUserByIdDb(id);
    if (!user) throw next(new ErrorHandler(404, "User not found"));
    return user;
  };

  // Service for updating user in the database
  static updateUser = async (req, next) => {
    const userData = req.body;
    const id = req.params.id;
    await this.getUser(id);

    const { error, updateUserData } = validateUpdatedUser(userData, {
      stripUnknown: true,
    });
    if (error) throw next(new ErrorHandler(400, error.message));

    return await updateUserDb(updateUserData, id);
  };

  // Service for deleting user in the database
  static deleteUser = async (req) => {
    const id = req.params.id;
    await this.getUser(id);

    return await deleteUserDb(id);
  };
}

export default UserService;
