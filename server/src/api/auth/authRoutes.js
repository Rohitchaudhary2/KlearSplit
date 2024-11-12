import { Router } from "express";

import passport from "../middlewares/googleStrategy.js";
import { login, logout, refreshToken } from "./authController.js";
import { authenticateToken } from "../middlewares/auth.js";
import logger from "../utils/logger.js";

const authRouter = Router();

authRouter.post("/login", login);

authRouter.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
    prompt: "select_account",
  }),
);

authRouter.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user) => {
    if (err) {
      logger.log({
        level: "error",
        statusCode: err.statusCode,
        message: err.message,
      });
      return res.redirect(
        `http://localhost:4200/login?error=${encodeURIComponent(err.message)}`,
      );
    }

    if (!user) {
      return res.redirect("http://localhost:4200/login?error=User not found");
    }

    // If authentication is successful
    const userData = {
      user: user.user,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    };

    res
      .cookie("accessToken", userData.accessToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 10 * 24 * 60 * 60 * 1000,
      })
      .cookie("refreshToken", userData.refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 10 * 24 * 60 * 60 * 1000,
      })
      .redirect(`http://localhost:4200/dashboard?id=${userData.user.user_id}`);
  })(req, res, next);
});

authRouter.get("/logout", authenticateToken, logout);
authRouter.get("/refreshtoken", refreshToken);

export default authRouter;
