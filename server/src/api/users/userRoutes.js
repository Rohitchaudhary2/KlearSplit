import { Router } from "express";
import UserController from "./userControllers.js";
import { authenticateToken } from "../middlewares/auth.js";
import {
  validateData,
  validateEmail,
  validateRestoreData,
} from "../middlewares/validationMiddleware.js";

const userRouter = Router();

// User API routes
userRouter.post("/verify", validateData, UserController.verifyUser);
userRouter.post("/register", validateData, UserController.createUser);
userRouter.post(
  "/verifyrestore",
  validateRestoreData,
  UserController.verifyRestoreUser,
);
userRouter.post("/restore", validateRestoreData, UserController.restoreUser);
userRouter.post(
  "/verifyforgotpassword",
  validateEmail,
  UserController.verifyForgotPassword,
);
userRouter.post(
  "/forgotpassword",
  validateRestoreData,
  UserController.forgotPassword,
);
userRouter.get("/:id", authenticateToken, UserController.getUser);
userRouter.get(
  "/getusers/:regex",
  authenticateToken,
  UserController.getUsersByRegex,
);
userRouter.patch(
  "/:id",
  validateData,
  authenticateToken,
  UserController.updateUser,
);
userRouter.delete("/:id", authenticateToken, UserController.deleteUser);

export default userRouter;
