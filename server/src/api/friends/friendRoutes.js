import { Router } from "express";
import FriendController from "./friendController.js";
import { authenticateToken } from "../middlewares/auth.js";
import { validateEmail } from "../middlewares/validationMiddleware.js";

const friendRouter = Router();

friendRouter.post(
  "/addfriend",
  authenticateToken,
  validateEmail,
  FriendController.addFriend,
);

export default friendRouter;
