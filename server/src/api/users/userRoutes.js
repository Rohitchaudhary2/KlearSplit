import { Router } from "express";
import {
  createUserController,
  getUserController,
  updateUserController,
  deleteUserController,
  verifyUserContoller,
  verifyRestoreUserContoller,
  restoreUserController,
  forgotPasswordController,
  verifyForgotPasswordController,
} from "./userControllers.js";
import { authenticateToken } from "../middlewares/auth.js";
import {
  validateData,
  validateForgotPassword,
  validateRestoreData,
} from "../middlewares/validationMiddleware.js";

const userRouter = Router();

// User API routes
userRouter.post("/verify", validateData, verifyUserContoller);
userRouter.post("/register", validateData, createUserController);
userRouter.post(
  "/verifyrestore",
  validateRestoreData,
  verifyRestoreUserContoller,
);
userRouter.post(
  "/verifyforgotpassword",
  validateForgotPassword,
  verifyForgotPasswordController,
);
userRouter.post(
  "/forgotpassword",
  validateForgotPassword,
  forgotPasswordController,
);
userRouter.post("/restore", validateRestoreData, restoreUserController);
userRouter.get("/:id", authenticateToken, getUserController);
userRouter.patch("/:id", validateData, authenticateToken, updateUserController);
userRouter.delete("/:id", authenticateToken, deleteUserController);

export default userRouter;
