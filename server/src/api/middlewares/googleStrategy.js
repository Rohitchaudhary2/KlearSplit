import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";

import { generateAccessAndRefereshTokens } from "../utils/tokenGenerator.js";
import { generatePassword } from "../utils/passwordGenerator.js";
import { hashedPassword } from "./../utils/hashPassword.js";
import sendMail from "../utils/sendMail.js";
import AuthService from "../auth/authServices.js";
import UserDb from "../users/userDb.js";
import { ErrorHandler } from "./errorHandler.js";
import Redis from "ioredis";
import logger from "../utils/logger.js";
import { auditLogFormat } from "../utils/auditFormat.js";
import AuditLogService from "../audit/auditService.js";

const redis = new Redis();

/**
 * This middleware is for google sign up and sign in
 */
passport.use(
  new GoogleStrategy(
    {
      "clientID": process.env.GOOGLE_CLIENT_ID,
      "clientSecret": process.env.GOOGLE_CLIENT_SECRET,
      "callbackURL": "http://localhost:3000/api/auth/google/callback"
    },
    async(accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists in the database
        let user = await UserDb.getUserByEmail(profile._json.email);
        let log = {};

        // If user is not present in the database or is been invited by someone
        if (!user || (user && user.dataValues.is_invited)) {
          const password = generatePassword();
          const hashPassword = await hashedPassword(password);
          const newUser = {};

          Object.assign(newUser, { "email": profile._json.email, "first_name": profile._json.given_name, "password": hashPassword, "is_invited": false });
          if (profile._json.family_name) {
            Object.assign(newUser, { "last_name": profile._json.family_name });
          }
          // If user is not present in database then create otherwise update the user information in the database
          if (!user) {
            user = (await UserDb.createUser(newUser)).dataValues;
            log = auditLogFormat("INSERT", user.user_id, "users", user.user_id, { "newData": user });
          } else {
            const oldData = user.dataValues;

            user = await UserDb.updateUser(
              newUser,
              user.dataValues.user_id
            );

            user = user[ 0 ].dataValues;
            log = auditLogFormat("UPDATE", user.user_id, "users", user.user_id, { oldData, "newData": user });
          }

          AuditLogService.createLog(log);

          const options = {
            "email": user.email,
            "subject": "Password for Sign in for KlearSplit"
          };

          sendMail(options, "passwordTemplate", {
            "name": user.first_name,
            "heading": "Welcome to Our Service",
            "email": user.email,
            "message": "Thank you for registering with us.",
            password
          });
        }

        const failedAttemptsKey = `failedAttempts:${user.email}`;
        let failedAttempts = (await redis.get(failedAttemptsKey)) || 0;

        failedAttempts = parseInt(failedAttempts);
        if (failedAttempts >= 3) {
          return done(
            new ErrorHandler(
              403,
              "Your account is temporarily unavailable. Please follow the instructions sent to your registered email."
            )
          );
        }

        // Generate access and refresh tokens
        const { "accessToken": generatedAccessToken, "refreshToken": generatedRefreshToken } = generateAccessAndRefereshTokens(
          user.user_id
        );

        await AuthService.createRefreshToken(generatedRefreshToken, user.email);

        await redis.del(failedAttemptsKey);
        return done(null, { user, generatedAccessToken, generatedRefreshToken });
      } catch (error) {
        logger.log({
          "level": "error",
          "message": JSON.stringify({
            "statusCode": error.statusCode,
            "message": error.message
          })
        });
        return done(error);
      }
    }
  )
);

export default passport;
