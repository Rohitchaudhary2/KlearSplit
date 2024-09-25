import bcrypt from "bcryptjs";
import { getUserByEmailDb } from "../users/userDb.js";
import {
  createRefreshTokenDb,
  deleteRefreshTokenDb,
  getRefreshTokenDb,
} from "./tokenDb.js";
import { ErrorHandler } from "../middlewares/ErrorHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";

class AuthService {
  // Service for handling login functionality 
  static loginService = async (req) => {
    const { email, password } = req.body;

    // Checking whether the email is correct
    const user = await getUserByEmailDb(email);
    if (!user) throw new ErrorHandler(404, "Email not found");

    // checking whether password is valid
    const validPassword = bcrypt.compare(password, user.password);
    if (!validPassword) throw new ErrorHandler(404, "Password is wrong");

    // Geneating access and refresh tokens
    const accessToken = generateAccessToken(user.user_id);
    const refreshToken = generateRefreshToken(user.user_id);

    // Storing refresh token in the database
    this.createRefreshTokenService({
      token: refreshToken,
      user_id: user.user_id,
    });

    return { user, accessToken, refreshToken };
  };

  // Service for handling logout functionality 
  static logoutService = async (req) => {
    const refreshToken = req.cookies["refreshToken"];

    // Deleting the refresh token from the database when user log out
    const isDeleted = await deleteRefreshTokenDb(refreshToken);

    return isDeleted;
  };

  // Service for creating refresh token
  static createRefreshTokenService = async (refreshToken, transaction) => {
    // Storing refresh token in the datbase
    const createdRefreshToken = await createRefreshTokenDb(
      refreshToken,
      transaction,
    );
    if (!createRefreshTokenDb)
      throw new ErrorHandler(500, "Error while storing refresh Token");
    return createdRefreshToken;
  };

  // Service to get refresh token from the database
  static getRefreshTokenService = async (req) => await getRefreshTokenDb(req);
}

export default AuthService;
