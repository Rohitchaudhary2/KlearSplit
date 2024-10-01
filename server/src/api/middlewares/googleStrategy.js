import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import passport from "passport";
import User from "../users/models/userModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenGenerator.js";
import { generatePassword } from "../utils/passwordGenerator.js";
import { hashedPassword } from "./../utils/hashPassword.js";
import sendMail from "../utils/sendMail.js";
import AuthService from "../auth/authServices.js";
import sequelize from "../../config/db.connection.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists in the database
        let user = await User.findOne({
          where: { email: profile._json.email },
        });

        if (!user) {
          const newUser = {};
          newUser.email = profile._json.email;
          newUser.first_name = profile._json.given_name;
          if (profile._json.family_name)
            newUser.last_name = profile._json.family_name;
          const password = generatePassword();
          newUser.password = await hashedPassword(password);
          user = await User.create(newUser);

          const options = {
            email: user.email,
            subject: "Password for Sign in for KlearSplit",
          };

          await sendMail(options, "passwordTemplate", {
            name: user.first_name,
            email: user.email,
            password,
          });
        }

        // Generate new access and refresh tokens
        const accessToken = generateAccessToken(user.user_id);
        const refreshToken = generateRefreshToken(user.user_id);

        const transaction = await sequelize.transaction();
        await AuthService.createRefreshToken(
          {
            token: refreshToken,
            user_id: user.user_id,
          },
          transaction,
        );

        // Commit the transaction
        await transaction.commit();

        return done(null, { user, accessToken, refreshToken });
      } catch (error) {
        return done(error);
      }
    },
  ),
);

export default passport;
