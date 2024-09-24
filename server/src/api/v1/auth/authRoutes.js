import { Router } from "express";
import { loginController, logoutController } from "./authController.js";
import { authenticateToken } from "../middlewares/auth.js";

const authRouter = Router();

authRouter.post("/login", loginController);
authRouter.get("/logout", authenticateToken, logoutController);

export default authRouter;
