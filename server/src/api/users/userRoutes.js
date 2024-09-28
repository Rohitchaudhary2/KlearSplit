import { Router } from "express";
import {
  createUserController,
  getUserController,
  updateUserController,
  deleteUserController,
  verifyUserContoller,
} from "./userControllers.js";
import { authenticateToken } from "../middlewares/auth.js";
import { validateData } from "../middlewares/validationMiddleware.js";

const userRouter = Router();

// User API routes
userRouter.post("/verify", validateData, verifyUserContoller);
userRouter.post("/register", validateData, createUserController);
userRouter.get("/:id", authenticateToken, getUserController);
userRouter.patch("/:id", validateData, authenticateToken, updateUserController);
userRouter.delete("/:id", authenticateToken, deleteUserController);

export default userRouter;
