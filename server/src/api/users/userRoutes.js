import { Router } from "express";
import UserController from "./userControllers.js";
import { authenticateToken } from "../middlewares/auth.js";
import {
  validateData,
  validateEmail,
  validateRestoreData
} from "../middlewares/validationMiddleware.js";

const userRouter = Router();

// Common Middlewares
// -authenticateToken: Ensures that the user is authenticated

// Route for sending otp to verify email by validating input data
userRouter.post("/verify", validateData, UserController.verifyUser);

// Route for creating user.
userRouter.post("/register", validateData, UserController.createUser);

// Route for sending otp to verify email by validating email
userRouter.post(
  "/verifyrestore",
  validateEmail,
  UserController.verifyRestoreUser
);

// Route for restoring deleted user.
userRouter.post("/restore", validateRestoreData, UserController.restoreUser);

// Route for sending otp to verify email by validating email
userRouter.post(
  "/verifyforgotpassword",
  validateEmail,
  UserController.verifyForgotPassword
);

// Route for changing user password for forgot password.
userRouter.post(
  "/forgotpassword",
  validateRestoreData,
  UserController.forgotPassword
);

// Route for getting loggedin user data.
userRouter.get("/getUser", authenticateToken, UserController.getUser);

// Route for getting users whose name or email matches a specific regex.
userRouter.get(
  "/getusers/:regex",
  authenticateToken,
  UserController.getUsersByRegex
);

// Route for updating user information.
userRouter.patch(
  "/:id",
  validateData,
  authenticateToken,
  UserController.updateUser
);

// Route for deleting user (soft deletion)
userRouter.delete("/", authenticateToken, UserController.deleteUser);

export default userRouter;
