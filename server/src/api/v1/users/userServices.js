import bcrypt from "bcryptjs";
import { generatePassword } from "../utils/passwordGenerator.js";
import {
  createUserDb,
  getUserByIdDb,
  updateUserDb,
  deleteUserDb,
  getUserByEmailDb,
  getUserByPhoneDb,
  restoreUserDb
} from "./userDb.js";
import { validateUpdatedUser, validateUser } from "./userValidations.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import AuthService from "../auth/authServices.js";
import { ErrorHandler } from "../middlewares/ErrorHandler.js";
import sequelize from "../../../config/db.connection.js";

class UserService {
  static createUserService = async (userData, next) => {
    // Validating and sanitizing the user data with JOI validator
    const { error, value: user } = validateUser(userData, {
      stripUnknown: true,
    });
    if (error) throw next(new ErrorHandler(400, error.message));
    
    // Restore flag to indicate whether the user has deleted his/her account previously
    let restoreFlag = false

    const isEmailExists = await getUserByEmailDb(user.email, false);
    if (isEmailExists){
      // If email already exists in database then checking whether user has deleted account
      if(isEmailExists.dataValues.deletedAt){
        restoreFlag = true
      }
      else throw next(new ErrorHandler(400, "Email already exists!"));
    }
      
    // Checking whether phone number exists in database if so then checking whether we are restoring user.
    const isPhoneExists = await getUserByPhoneDb(user.phone);
    if (isPhoneExists && !restoreFlag)
      throw next(new ErrorHandler(400, "Phone Number already exists!"));

    //Generating random password
    const password = generatePassword();

    //Hashing the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user.password = hashedPassword;

    console.log(password); // Send mail for password to the user

    const transaction = await sequelize.transaction(); // Starting a new transaction

    try {
      let createdUser;
      if(restoreFlag){
        // Restoring user in the database
        await restoreUserDb(user.email, transaction);
        createdUser = isEmailExists.dataValues
      }
        
      else 
      // Creating new user in the database
        createdUser = await createUserDb(user, transaction);

      // Generate access and refresh tokens
      const accessToken = generateAccessToken(createdUser.user_id);
      const refreshToken = generateRefreshToken(createdUser.user_id);

      // Store the refresh token in the database
      await AuthService.createRefreshTokenService(
        {
          token: refreshToken,
          user_id: createdUser.user_id,
        },
        transaction,
      );

      // Commit the transaction
      await transaction.commit();

      return { user: createdUser, accessToken, refreshToken };
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error; // Rethrow the error after rollback
    }
  };

  // Service to get user from database
  static getUserService = async (id, next) => {
    const user = await getUserByIdDb(id);
    if (!user) throw next(new ErrorHandler(404, "User not found"));
    return user;
  };

  // Service for updating user in the database
  static updateUserService = async (req, next) => {
    const userData = req.body;
    const id = req.params.id;
    await this.getUserService(id);

    const { error, updateUserData } = validateUpdatedUser(userData, {
      stripUnknown: true,
    });
    if (error) throw next(new ErrorHandler(400, error.message));

    return await updateUserDb(updateUserData, id);
  };

  // Service for deleting user in the database
  static deleteUserService = async (req) => {
    const id = req.params.id;
    await this.getUserService(id);

    return await deleteUserDb(id);
  };
}

export default UserService;
