import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";

import { generateAccessAndRefereshTokens } from "../utils/tokenGenerator.js";
import { generatePassword } from "../utils/passwordGenerator.js";
import { hashedPassword } from "./../utils/hashPassword.js";
import sendMail from "../utils/sendMail.js";
import AuthService from "../auth/authServices.js";
import { sequelize } from "../../config/db.connection.js";
import UserDb from "../users/userDb.js";
import { ErrorHandler } from "./errorHandler.js";
import Redis from "ioredis";
import logger from "../utils/logger.js";

const redis = new Redis();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      const transaction = await sequelize.transaction();
      try {
        // Check if the user already exists in the database
        let user = await UserDb.getUserByEmail(profile._json.email);

        if (!user || (user && user.dataValues.is_invited)) {
          const newUser = {};
          newUser.email = profile._json.email;
          newUser.first_name = profile._json.given_name;
          if (profile._json.family_name)
            newUser.last_name = profile._json.family_name;
          const password = generatePassword();
          newUser.password = await hashedPassword(password);
          newUser.is_invited = false;
          if (!user) {
            user = await UserDb.createUser(newUser, transaction);
            user = user.dataValues;
          } else {
            user = await UserDb.updateUser(
              newUser,
              user.dataValues.user_id,
              transaction,
            );
            user = user[0].dataValues;
          }

          const options = {
            email: user.email,
            subject: "Password for Sign in for KlearSplit",
          };

          await sendMail(options, "passwordTemplate", {
            name: user.first_name,
            heading: "Welcome to Our Service",
            email: user.email,
            message: "Thank you for registering with us.",
            password,
            message: "Thank you for registering with us.",
          });
        }

        const failedAttemptsKey = `failedAttempts:${user.email}`;
        let failedAttempts = (await redis.get(failedAttemptsKey)) || 0;
        failedAttempts = parseInt(failedAttempts);
        if (failedAttempts >= 3) {
          return done(
            new ErrorHandler(
              403,
              "Your account is temporarily unavailable. Please follow the instructions sent to your registered email.",
            ),
          );
        }

        // Generate access and refresh tokens
        const { accessToken, refreshToken } = generateAccessAndRefereshTokens(
          user.user_id,
        );

        await AuthService.createRefreshToken(refreshToken, user.email);

        await redis.del(failedAttemptsKey);

        // Commit the transaction
        await transaction.commit();

        return done(null, { user, accessToken, refreshToken });
      } catch (error) {
        await transaction.rollback();
        logger.log({
          level: "error",
          statusCode: error.statusCode,
          message: error.message,
        });
        return done(error);
      }
    },
  ),
);

export default passport;
