import { Router } from "express";
import {
  createUserController,
  getUserController,
  updateUserController,
  deleteUserController,
  verifyUserContoller,
} from "./userControllers.js";
import { authenticateToken } from "../middlewares/auth.js";

const userRouter = Router();

// User API routes
userRouter.post("/verify", verifyUserContoller);
userRouter.post("/register", createUserController);
userRouter.get("/:id", authenticateToken, getUserController);
userRouter.patch("/:id", authenticateToken, updateUserController);
userRouter.delete("/:id", authenticateToken, deleteUserController);

export default userRouter;
