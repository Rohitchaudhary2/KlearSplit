import { Router } from "express";

import passport from "../middlewares/googleStrategy.js";
import { loginController, logoutController } from "./authController.js";
import { authenticateToken } from "../middlewares/auth.js";

const authRouter = Router();

authRouter.post("/login", loginController);

authRouter.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  }),
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:4200/login",
  }),
  (req, res) => {
    const userData = {
      user: req.user.user.dataValues,
      accessToken: req.user.accessToken,
      refreshToken: req.user.refreshToken,
    };
    res
      .set("Authorization", `Bearer ${userData.accessToken}`)
      .cookie("refreshToken", userData.refreshToken, {
        httpOnly: true,
        sameSite: "strict",
      })
      .redirect(`http://localhost:4200/dashboard?id=${userData.user.user_id}`);
  },
);

authRouter.get("/logout", authenticateToken, logoutController);

export default authRouter;
