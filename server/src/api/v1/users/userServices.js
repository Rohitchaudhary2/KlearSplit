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
    const { error, value: user } = validateUser(userData, {
      stripUnknown: true,
    });
    if (error) throw next(new ErrorHandler(400, error.message));
    let restoreFlag = false

    const isEmailExists = await getUserByEmailDb(user.email, false);
    if (isEmailExists){
      if(isEmailExists.dataValues.deletedAt){
        restoreFlag = true
      }
      else throw next(new ErrorHandler(400, "Email already exists!"));
    }
      
    if(!restoreFlag) {
      const isPhoneExists = await getUserByPhoneDb(user.phone);
      if (isPhoneExists)
        throw next(new ErrorHandler(400, "Phone Number already exists!"));
    }

    const password = generatePassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user.password = hashedPassword;

    console.log(password); // Send mail for password to the user

    const transaction = await sequelize.transaction(); // Starting a new transaction

    try {
      let createdUser;
      if(restoreFlag){
        // R a user in the database
        await restoreUserDb(user.email, transaction);
        createdUser = isEmailExists.dataValues
      }
        
      else 
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

  static getUserService = async (id, next) => {
    const user = await getUserByIdDb(id);
    if (!user) throw next(new ErrorHandler(404, "User not found"));
    return user;
  };

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

  static deleteUserService = async (req) => {
    const id = req.params.id;
    await this.getUserService(id);

    return await deleteUserDb(id);
  };
}

export default UserService;
