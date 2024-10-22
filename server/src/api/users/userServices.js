import { generatePassword } from "../utils/passwordGenerator.js";
import UserDb from "./userDb.js";
import { generateAccessAndRefereshTokens } from "../utils/tokenGenerator.js";
import AuthService from "../auth/authServices.js";
import { sequelize } from "../../config/db.connection.js";
import { hashedPassword } from "../utils/hashPassword.js";
import sendMail from "../utils/sendMail.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";
import { otpGenrator } from "../utils/otpGenerator.js";
import FriendService from "../friends/friendService.js";
import Redis from "ioredis";

const redis = new Redis();

class UserService {
  static verifyUser = async (user) => {
    const isUserExists = await UserDb.getUserByEmail(user.email, false);

    // If email or phone already exists in database then checking whether user has deleted account
    if (isUserExists && isUserExists.dataValues.deletedAt)
      throw new ErrorHandler(
        410,
        "Looks like you had an account. Please restore it.",
      );
    else if (isUserExists && !isUserExists.dataValues.is_invited)
      throw new ErrorHandler(400, "Account already exist for provided Email.");

    // send otp
    const otp = otpGenrator();

    await redis.setex(`otp:${user.email}`, 300, otp);

    await sendMail(
      {
        email: user.email,
        subject: "Otp for sign up in KlearSplit",
      },
      "otpTemplate",
      {
        name: user.first_name,
        otp,
        message: "Thank you for registering with us.",
      },
    );
  };

  static createUser = async (user) => {
    const userOtp = user.otp;
    delete user.otp;

    const otp = await redis.get(`otp:${user.email}`);
    if (otp === userOtp) {
      await redis.del(`otp:${user.email}`);
    } else {
      throw new ErrorHandler(400, "Invalid or Expired Otp.");
    }

    const isUserExists = await UserDb.getUserByEmail(user.email, false);

    //Generating random password
    const password = generatePassword();

    //Hashing the password
    user.password = await hashedPassword(password);

    const transaction = await sequelize.transaction(); // Starting a new transaction

    try {
      let createdUser;
      if (!isUserExists) {
        // Creating new user in the database
        createdUser = await UserDb.createUser(user, transaction);
      } else if (isUserExists && isUserExists.dataValues.is_invited) {
        createdUser = await UserDb.updateUser(
          { ...user, is_invited: false },
          isUserExists.dataValues.user_id,
          transaction,
        );
        createdUser = createdUser[0].dataValues;
        if (!createdUser) {
          throw new ErrorHandler(400, "Error while Registering");
        }
      }

      // Generate access and refresh tokens
      const { accessToken, refreshToken } = generateAccessAndRefereshTokens(
        createdUser.user_id,
      );

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

      await sendMail(options, "passwordTemplate", {
        name: user.first_name,
        heading: "Welcome to Our Service",
        email: user.email,
        password,
        message: "Thank you for registering with us.",
      });

      return { user: createdUser, accessToken, refreshToken };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  };

  static verifyRestoreUser = async (user) => {
    const isEmailExists = await UserDb.getUserByEmail(user.email, false);

    if (!isEmailExists) {
      throw new ErrorHandler(
        400,
        "No Record found. Please Create new account.",
      );
    } else if (
      isEmailExists.dataValues &&
      !isEmailExists.dataValues.deletedAt
    ) {
      throw new ErrorHandler(400, "Account for this Email is active.");
    }

    const otp = otpGenrator();

    await redis.setex(`otp:${user.email}`, 300, otp);

    await sendMail(
      {
        email: user.email,
        subject: "Otp for restoring your account for KlearSplit",
      },
      "otpTemplate",
      {
        name: isEmailExists.dataValues.first_name,
        otp,
        message: "We received a request to restore access to your account.",
      },
    );
  };

  static restoreUser = async (user) => {
    const isEmailExists = await UserDb.getUserByEmail(user.email, false);
    if (!isEmailExists) throw new ErrorHandler(400, "User not found");
    if (!isEmailExists.dataValues.deletedAt)
      throw new ErrorHandler(400, "Account for this Email is already active.");

    const otp = await redis.get(`otp:${user.email}`);
    if (otp === user.otp) {
      await redis.del(`otp:${user.email}`);
    } else {
      throw new ErrorHandler(400, "Invalid or Expired Otp.");
    }

    const transaction = await sequelize.transaction(); // Starting a new transaction

    try {
      // Restoring user in the database
      await UserDb.restoreUser(isEmailExists, transaction);
      const restoredUser = isEmailExists.dataValues;

      // Generate access and refresh tokens
      const { accessToken, refreshToken } = generateAccessAndRefereshTokens(
        restoredUser.user_id,
      );

      // Store the refresh token in the database
      await AuthService.createRefreshToken(
        {
          token: refreshToken,
          user_id: restoredUser.user_id,
        },
        transaction,
      );

      // Commit the transaction
      await transaction.commit();

      return { user: restoredUser, accessToken, refreshToken };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  };

  static verifyForgotPassword = async (user) => {
    const isEmailExists = await UserDb.getUserByEmail(user.email, false);

    if (!isEmailExists) {
      throw new ErrorHandler(400, "No Record found.");
    } else if (isEmailExists.dataValues && isEmailExists.dataValues.deletedAt) {
      throw new ErrorHandler(
        400,
        "Account for this email is deactivated. Please restore it.",
      );
    }

    const otp = otpGenrator();

    await redis.setex(`otp:${user.email}`, 300, otp);

    await sendMail(
      {
        email: user.email,
        subject: "Otp for changing password for KlearSplit",
      },
      "otpTemplate",
      {
        name: isEmailExists.dataValues.first_name,
        otp,
        message: "We received a request to reset your password.",
      },
    );
  };

  static forgotPassword = async (userData) => {
    const user = await UserDb.getUserByEmail(userData.email);
    if (!user) throw new ErrorHandler(400, "Email does not exist");

    const otp = await redis.get(`otp:${user.email}`);
    if (otp === userData.otp) {
      await redis.del(`otp:${user.email}`);
      await redis.del(`failedAttempts:${user.email}`);
    } else {
      throw new ErrorHandler(400, "Invalid or Expired Otp.");
    }

    const password = generatePassword();
    const hashPassword = await hashedPassword(password);

    await UserDb.updateUser(
      { password: hashPassword, failedAttempts: 0, lockoutUntil: null },
      user.user_id,
    );

    const options = {
      email: user.email,
      subject: "Password Reset Confirmation",
    };

    await sendMail(options, "passwordTemplate", {
      name: user.first_name,
      email: user.email,
      heading: "Password Successfully Changed",
      password,
      message: "Your password has been successfully reset.",
    });
  };

  // Service to get user from database
  static getUser = async (id) => {
    const user = await UserDb.getUserById(id);
    if (!user) throw new ErrorHandler(404, "User not found.");
    return user;
  };

  // Service to get users by a regular expression
  static getUsersByRegex = async (data) => {
    const users = await UserDb.getUsersByRegex(data.regex);
    const filteredUsers = await Promise.all(
      users
        .filter((user) => user.user_id !== data.user_id) // Filter out the current user
        .map(async (user) => {
          const newFriendData = {
            friend1_id: data.user_id, // Assuming logged-in user's ID
            friend2_id: user.user_id,
          };

          // Check if the friend relationship exists
          const friendExist =
            await FriendService.checkFriendExist(newFriendData);

          // Return user if not a friend, otherwise null
          return friendExist ? null : user;
        }),
    );

    // Remove null values (users who are already friends)
    return filteredUsers.filter((user) => user !== null);
  };

  // Service for updating user in the database
  static updateUser = async (req) => {
    const user = req.validatedUser;
    const id = req.params.id;
    await this.getUser(id);

    return await UserDb.updateUser(user, id);
  };

  // Service for deleting user in the database
  static deleteUser = async (req) => {
    const id = req.params.id;
    const user = await this.getUser(id);
    const transaction = await sequelize.transaction();

    try {
      await UserDb.deleteUser(user);
      await transaction.commit();
      return { message: "User deleted successfully" };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };
}

export default UserService;
