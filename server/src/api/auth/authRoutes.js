import { Router } from "express";

import passport from "../middlewares/googleStrategy.js";
import { login, logout, refreshToken } from "./authController.js";
import { authenticateToken } from "../middlewares/auth.js";
import logger from "../utils/logger.js";
import { validateBody } from "./../middlewares/validationMiddleware.js";
import { loginSchema } from "./authValidations.js";

const authRouter = Router();

// Route for authenticating the user with email and password
authRouter.post("/login", validateBody(loginSchema), login);

// Route for authenticating user with Google
authRouter.get(
  "/google",
  passport.authenticate("google", {
    "session": false,
    "scope": [ "profile", "email" ],
    "prompt": "select_account"
  })
);

// After success or failure while logging in with the help of Google
authRouter.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { "session": false }, (err, user) => {
    if (err) {
      logger.log({
        "level": "error",
        "statusCode": err.statusCode,
        "message": err.message
      });
      return res.redirect(
        `http://localhost:4200/login?error=${encodeURIComponent(err.message)}`
      );
    }

    if (!user) {
      return res.redirect("http://localhost:4200/login?error=User not found");
    }

    // If authentication is successful
    const userData = {
      "user": user.user,
      "accessToken": user.generatedAccessToken,
      "refreshToken": user.generatedRefreshToken
    };

    res
      .cookie("accessToken", userData.accessToken, {
        "httpOnly": true,
        "sameSite": "strict",
        "maxAge": 10 * 24 * 60 * 60 * 1000
      })
      .cookie("refreshToken", userData.refreshToken, {
        "httpOnly": true,
        "sameSite": "strict",
        "maxAge": 10 * 24 * 60 * 60 * 1000
      })
      .redirect(`http://localhost:4200/dashboard?id=${userData.user.user_id}`);
  })(req, res, next);
});

// Route for logout
authRouter.get("/logout", authenticateToken, logout);

// Route for generating new access and refresh token
authRouter.get("/refreshtoken", refreshToken);

export default authRouter;
