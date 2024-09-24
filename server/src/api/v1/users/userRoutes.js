import { Router } from "express";
import {
  createUserController,
  getUserController,
  updateUserController,
  deleteUserController,
} from "./userControllers.js";
import { authenticateToken } from "../middlewares/auth.js";

const userRouter = Router();

userRouter.post("/register", createUserController);
userRouter.get("/:id", authenticateToken, getUserController);
userRouter.patch("/:id", authenticateToken, updateUserController);
userRouter.delete("/:id", authenticateToken, deleteUserController);

export default userRouter;
