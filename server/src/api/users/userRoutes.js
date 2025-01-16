import { Router } from "express";
import UserController from "./userControllers.js";
import { authenticateToken } from "../middlewares/auth.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import * as userSchema from "./userValidations.js";
import uploadMiddleware from "../middlewares/uploadMiddleware.js";

const userRouter = Router();

// Common Middlewares
// -authenticateToken: Ensures that the user is authenticated

// Route for sending otp to verify email by validating input data
userRouter.post("/verify", validateBody(userSchema.createUserSchema), UserController.verifyUser);

// Route for creating user.
userRouter.post("/register", validateBody(userSchema.createUserSchema), UserController.createUser);

// Route for sending otp to verify email by validating email
userRouter.post(
  "/verifyrestore",
  validateBody(userSchema.emailSchema),
  UserController.verifyRestoreUser
);

// Route for restoring deleted user.
userRouter.post("/restore", validateBody(userSchema.restoreUserSchema), UserController.restoreUser);

// Route for sending otp to verify email by validating email
userRouter.post(
  "/verifyforgotpassword",
  validateBody(userSchema.emailSchema),
  UserController.verifyForgotPassword
);

// Route for changing user password for forgot password.
userRouter.post(
  "/forgotpassword",
  validateBody(userSchema.restoreUserSchema),
  UserController.forgotPassword
);

// Route for getting loggedin user data.
userRouter.get("/user", authenticateToken, UserController.getUser);

// Route for getting users whose name or email matches a specific regex.
userRouter.get(
  "/getusers/:regex",
  authenticateToken,
  UserController.getUsersByRegex
);

// Route for updating user information.
userRouter.patch(
  "/:id",
  authenticateToken,
  uploadMiddleware("profileImages", "profile"),
  validateBody(userSchema.updateUserSchema),
  UserController.updateUser
);

// Route for deleting user (soft deletion)
userRouter.delete("/", authenticateToken, UserController.deleteUser);

export default userRouter;
