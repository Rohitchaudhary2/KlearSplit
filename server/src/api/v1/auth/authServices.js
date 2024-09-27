import bcrypt from "bcryptjs";
import { getUserByEmailDb } from "../users/userDb.js";
import {
  createRefreshTokenDb,
  deleteRefreshTokenDb,
  getRefreshTokenDb,
} from "./tokenDb.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";

class AuthService {
  // Service for handling login functionality
  static login = async (req, next) => {
    const { email, password } = req.body;

    // Checking whether the email is correct
    const user = await getUserByEmailDb(email);
    if (!user) return next(new ErrorHandler(404, "Email not found"));

    // checking whether password is valid
    const validPassword = bcrypt.compare(password, user.password);
    if (!validPassword) return next(new ErrorHandler(404, "Password is wrong"));

    // Geneating access and refresh tokens
    const accessToken = generateAccessToken(user.user_id, next);
    const refreshToken = generateRefreshToken(user.user_id, next);

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
  static createRefreshToken = async (refreshToken, transaction, next) => {
    // Storing refresh token in the datbase
    const createdRefreshToken = await createRefreshTokenDb(
      refreshToken,
      transaction,
    );
    if (!createdRefreshToken)
      return next(new ErrorHandler(500, "Error while storing refresh Token"));
    return createdRefreshToken;
  };

  // Service to get refresh token from the database
  static getRefreshToken = async (req) => await getRefreshTokenDb(req);
}

export default AuthService;
