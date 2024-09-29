import { generatePassword } from "../utils/passwordGenerator.js";
import {
  createUserDb,
  getUserByIdDb,
  updateUserDb,
  deleteUserDb,
  getUserByEmailDb,
  getUserByEmailorPhoneDb,
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
  static verifyUser = async (user, next) => {
    const isUserExists = await getUserByEmailorPhoneDb(
      user.email,
      user.phone,
      false,
    );
    // If email or phone already exists in database then checking whether user has deleted account
    if (isUserExists && isUserExists.dataValues.deletedAt)
      throw next(new ErrorHandler(400, "Looks like you had an account."))
    else if (isUserExists)
      throw next(new ErrorHandler(400, "Email or Phone number already exists."))

    // send otp
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await createOtpDb({
      email: user.email,
      phone: user.phone,
      otp,
      otp_expiry_time: otpExpiresAt,
    });

    await sendMail(
      {
        email: user.email,
        subject: "Otp for sign up in KlearSplit",
      }, 
      'otpTemplate',
      {
        name: user.first_name,
        otp
      },
      next
    );
  };

  static createUser = async (user, next) => {
    const userOtp = user.otp;
    delete user.otp;

    // Restore flag to indicate whether the user has deleted his/her account previously
    let restoreFlag = false;

    const isEmailExists = await getUserByEmailDb(user.email, false);
    if (isEmailExists && isEmailExists.dataValues.deletedAt) {
      restoreFlag = true;
    }

    const otp = await getOtpDb(user.email, user.phone, userOtp);

    if (!otp) throw next(new ErrorHandler(400, "Invalid Otp."))

    if (new Date() >= otp.otp_expiry_time)
      throw next(new ErrorHandler(400, "Otp has been expired."))

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
        },
        transaction,
        next,
      );

      // Commit the transaction
      await transaction.commit();

      const options = {
        email: user.email,
        subject: "Password for Sign in for KlearSplit",
      };

      sendMail(options, 
        'passwordTemplate',
        {
          name: user.first_name,
          email: user.email,
          password
        }, next);

      return { user: createdUser, accessToken, refreshToken };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  };

  // Service to get user from database
  static getUser = async (id) => {
    const user = await getUserByIdDb(id);
    if (!user) throw next(new ErrorHandler(404, "User not found.")) 
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
