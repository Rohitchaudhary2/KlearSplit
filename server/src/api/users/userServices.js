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
import AuditLogService from "../audit/auditService.js";
import { auditLogFormat } from "../utils/auditFormat.js";
import { sendWelcomeMessage } from "../utils/whatsappMessage.js";
import logger from "../utils/logger.js";
import bcrypt from "bcryptjs";

const redis = new Redis();

class UserService {
  /**
   * Verifies the user during the sign-up process by checking if the email already exists in the database
   * and sending an OTP if the user is new or if they are eligible to restore their deleted account.
   *
   * @param {Object} user - The user object containing user information.
   * @throws {ErrorHandler} Throws an error if the user account already exists, or if the user has a deleted account.
   */
  static verifyUser = async(user) => {
    const isUserExists = await UserDb.getUserByEmail(user.email, false);

    // If the user exists and has a deleted account, throw an error asking to restore the account
    if (isUserExists && isUserExists.dataValues.deletedAt) {
      throw new ErrorHandler(
        410,
        "Looks like you had an account. Please restore it."
      );
    }
      
    // If the user exists but was not invited, throw an error indicating account already exists
    if (isUserExists && !isUserExists.dataValues.is_invited) {
      throw new ErrorHandler(400, "Account already exist for provided Email.");
    }
    
    const otp = otpGenrator();

    await redis.setex(`otp:${user.email}`, 300, otp);

    sendMail(
      {
        "email": user.email,
        "subject": "Otp for sign up in KlearSplit"
      },
      "otpTemplate",
      {
        "name": user.first_name,
        otp,
        "message": "Thank you for registering with us."
      }
    );
  };

  /**
   * Creates a new user or updates an existing user in the system after OTP validation.
   * The user is also assigned a random password, hashed, and then registered in the database.
   * Access and refresh tokens are generated, and a welcome email with the password is sent.
   *
   * @param {Object} user - The user object containing user information.
   * @throws {ErrorHandler} Throws an error if OTP is invalid, expired, or if there are issues during user creation or update.
   * @returns {Object} Returns an object containing the created or updated user data and access & refresh tokens.
   */
  static createUser = async(user) => {
    const otp = await redis.get(`otp:${user.email}`);

    if (otp !== user.otp) {
      throw new ErrorHandler(400, "Invalid or Expired Otp.");
    }

    delete user.otp;
    await redis.del(`otp:${user.email}`);
    const isUserExists = await UserDb.getUserByEmail(user.email, false);

    const password = generatePassword();

    user.password = await hashedPassword(password);

    const transaction = await sequelize.transaction(); // Starting a new transaction

    try {
      let createdUser;

      if (!isUserExists) {
        // Creating new user in the database
        createdUser = await UserDb.createUser(user, transaction);
        AuditLogService.createLog(auditLogFormat("INSERT", createdUser.user_id, "users", createdUser.user_id, { "newData": createdUser }));
      } else if (isUserExists && isUserExists.dataValues.is_invited) {
        createdUser = await UserDb.updateUser(
          { ...user, "is_invited": false },
          isUserExists.dataValues.user_id,
          transaction
        );
        createdUser = createdUser[ 0 ].dataValues;
        if (!createdUser) {
          throw new ErrorHandler(400, "Error while Registering");
        }
        AuditLogService.createLog(auditLogFormat("UPDATE", createdUser.user_id, "users", createdUser.user_id, { "oldData": createdUser, "newData": createdUser }));
      }

      // Generate access and refresh tokens
      const { accessToken, refreshToken } = generateAccessAndRefereshTokens(
        createdUser.user_id
      );

      // Store the refresh token in the database
      await AuthService.createRefreshToken(refreshToken, user.email);

      // Commit the transaction
      await transaction.commit();

      const options = {
        "email": user.email,
        "subject": "Password for Sign in for KlearSplit"
      };

      sendMail(options, "passwordTemplate", {
        "name": user.first_name,
        "heading": "Welcome to Our Service",
        "email": user.email,
        password,
        "message": "Thank you for registering with us."
      });

      // Send WhatsApp message
      const responses = await sendWelcomeMessage(user);

      if (responses.error) {
        responses.forEach((response) => {
          logger.log({
            "level": "error",
            "message": JSON.stringify({
              "statusCode": response.statusCode,
              "message": response.error.message
            })
          });
        });
      }

      return { "user": createdUser, accessToken, refreshToken };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  };

  /**
   * Verifies a user's email for account restoration by generating and sending an OTP.
   *
   * @param {Object} user - The user object containing the email for restoration.
   *
   * @throws {ErrorHandler} Throws an error if:
   *   - No user record is found with the provided email.
   *   - The user account is active and not deleted.
   */
  static verifyRestoreUser = async(user) => {
    const isEmailExists = await UserDb.getUserByEmail(user.email, false);

    if (!isEmailExists) {
      throw new ErrorHandler(
        400,
        "No Record found. Please Create new account."
      );
    } else if (isEmailExists.dataValues && !isEmailExists.dataValues.deletedAt) {
      throw new ErrorHandler(400, "Account for this Email is active.");
    }

    const otp = otpGenrator();

    await redis.setex(`otp:${user.email}`, 300, otp);

    sendMail(
      {
        "email": user.email,
        "subject": "Otp for restoring your account for KlearSplit"
      },
      "otpTemplate",
      {
        "name": isEmailExists.dataValues.first_name,
        otp,
        "message": "We received a request to restore access to your account."
      }
    );
  };

  /**
   * Restores a user account that was previously deleted, given a valid OTP.
   *
   * @param {Object} user - The user object containing the necessary information for account restoration.
   * @param {string} user.email - The email address of the user whose account is to be restored.
   * @param {string} user.otp - The OTP provided by the user to verify the account restoration.
   *
   * @throws {ErrorHandler} Throws an error if:
   *   - The email is not found in the database.
   *   - The account is already active (not deleted).
   *   - The OTP is invalid or expired.
   *
   * @returns {Object} Returns the restored user and the generated tokens.
   */
  static restoreUser = async(user) => {
    const isEmailExists = await UserDb.getUserByEmail(user.email, false);

    if (!isEmailExists) {
      throw new ErrorHandler(400, "User not found");
    }
    if (!isEmailExists.dataValues.deletedAt) {
      throw new ErrorHandler(400, "Account for this Email is already active.");
    }

    const otp = await redis.get(`otp:${user.email}`);

    if (otp !== user.otp) {
      throw new ErrorHandler(400, "Invalid or Expired Otp.");
    }

    await redis.del(`otp:${user.email}`);
    const transaction = await sequelize.transaction(); // Starting a new transaction

    try {
      // Restoring user in the database
      await UserDb.restoreUser(isEmailExists, transaction);
      const restoredUser = isEmailExists.dataValues;

      // Generate access and refresh tokens
      const { accessToken, refreshToken } = generateAccessAndRefereshTokens(
        restoredUser.user_id
      );

      // Store the refresh token in the database
      await AuthService.createRefreshToken(refreshToken, user.email);

      // Commit the transaction
      await transaction.commit();

      return { "user": restoredUser, accessToken, refreshToken };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  };

  /**
   * Verifies the user's request to change the password by generating and sending an OTP.
   *
   * @param {Object} user - The user object containing the email for password reset.
   * @param {string} user.email - The email address of the user requesting to reset their password.
   *
   * @throws {ErrorHandler} Throws an error if:
   *   - No user record is found with the provided email.
   *   - The account for the provided email is deactivated (i.e., deleted).
   */
  static verifyForgotPassword = async(user) => {
    const isEmailExists = await UserDb.getUserByEmail(user.email, false);

    if (!isEmailExists) {
      throw new ErrorHandler(400, "No Record found.");
    } else if (isEmailExists.dataValues && isEmailExists.dataValues.deletedAt) {
      throw new ErrorHandler(
        400,
        "Account for this email is deactivated. Please restore it."
      );
    }

    const otp = otpGenrator();

    await redis.setex(`otp:${user.email}`, 300, otp);

    sendMail(
      {
        "email": user.email,
        "subject": "Otp for changing password for KlearSplit"
      },
      "otpTemplate",
      {
        "name": isEmailExists.dataValues.first_name,
        otp,
        "message": "We received a request to reset your password."
      }
    );
  };

  /**
   * Handles the password reset process for a user.
   * @param {Object} userData - The data sent by the user requesting the password reset.
   * @param {string} userData.email - The user's email address.
   * @param {string} userData.otp - The one-time password (OTP) provided by the user to verify their identity.
   * @throws {ErrorHandler} Throws an error if the email does not exist, or the OTP is invalid or expired.
   */
  static forgotPassword = async(userData) => {
    const user = await UserDb.getUserByEmail(userData.email);

    if (!user) {
      throw new ErrorHandler(400, "Email does not exist");
    }

    const otp = await redis.get(`otp:${user.email}`);

    if (otp !== userData.otp) {
      throw new ErrorHandler(400, "Invalid or Expired Otp.");
    }

    await redis.del(`otp:${user.email}`);
    await redis.del(`failedAttempts:${user.email}`);
    const password = generatePassword();
    const hashPassword = await hashedPassword(password);

    const updatedUser = await UserDb.updateUser(
      { "password": hashPassword, "failedAttempts": 0, "lockoutUntil": null },
      user.user_id
    );

    AuditLogService.createLog(auditLogFormat("UPDATE", user.user_id, "users", user.user_id, { "oldData": user.dataValues, "newData": updatedUser[ 0 ].dataValues }));

    const options = {
      "email": user.email,
      "subject": "Password Reset Confirmation"
    };

    sendMail(options, "passwordTemplate", {
      "name": user.first_name,
      "email": user.email,
      "heading": "Password Successfully Changed",
      password,
      "message": "Your password has been successfully reset."
    });
  };

  // Service to get user from database
  static getUser = async(id) => {
    const user = await UserDb.getUserById(id);

    if (!user) {
      throw new ErrorHandler(404, "User not found.");
    }
    return user;
  };

  /**
   * Retrieves users based on a regular expression search and filters out friends.
   * @param {Object} data - The input data for fetching users based on regex search.
   * @param {string} data.regex - The regular expression pattern to search for users (e.g., a username or email pattern).
   * @param {string} data.fetchAll - Boolean for deciding whether to send all users or filtering out friends.
   * @param {string} userId - The ID of the currently logged-in user (to filter out their existing friends).
   * @returns {Promise<Array>} - A filtered list of users who match the regex but are not friends with the logged-in user.
   */
  static getUsersByRegex = async({ data, userId }) => {
    const users = await UserDb.getUsersByRegex(data.regex, userId);

    if (data.fetchAll) {
      return users;
    }
    const filteredUsers = await Promise.all(
      users
        .map(async(user) => {
          const newFriendData = {
            "friend1_id": userId, // Assuming logged-in user's ID
            "friend2_id": user.user_id
          };

          // Check if the friend relationship exists
          const friendExist = await FriendService.checkFriendExist(newFriendData);

          // Return user if not a friend, otherwise null
          return friendExist ? null : user;
        })
    );

    // Remove null values (users who are already friends)
    return filteredUsers.filter((user) => user !== null);
  };

  /**
   * Updates the user information in the database.
   * @param {string} id - The id of the logged in user.
   * @param {Object} updatedUserData - The validated user object with the updated user data.
   * @returns {Promise<Object>} - The result of the update operation (updated user data).
   */
  static updateUser = async(user, id, email) => {
    const existingUser = await UserDb.getUserByEmail(email);
    
    if (user.password) {
      const validPassword = await bcrypt.compare(user.password, existingUser.dataValues.password);

      if (!validPassword) {
        throw new ErrorHandler(400, "Wrong Password. If you've forgotten your password, please use the 'Forgot Password' option on Login Page to reset it.");
      }

      user.password = await hashedPassword(user.new_password);
    }
    return await UserDb.updateUser(user, id);
  };

  /**
   * Deletes a user from the database.
   * @param {Object} req - The request object containing the user data.
   * @param {Object} req.user - The user object for the currently authenticated user.
   * @returns {Promise<Object>} - A message indicating the result of the deletion operation.
   */
  static deleteUser = async(req) => {
    const id = req.user.user_id;
    const user = await this.getUser(id);

    return await UserDb.deleteUser(user);
  };
}

export default UserService;
