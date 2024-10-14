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

friendRouter.get(
  "/getallfriends",
  authenticateToken,
  FriendController.getAllFriends,
);

friendRouter.patch(
  "/acceptrejectfriend/:conversation_id",
  authenticateToken,
  FriendController.acceptRejectFriendRequest,
);

friendRouter.delete(
  "/withdrawfriendrequest/:conversation_id",
  authenticateToken,
  FriendController.withdrawFriendRequest,
);

friendRouter.patch(
  "/archiveblockfriend/:conversation_id",
  authenticateToken,
  FriendController.archiveBlockFriend,
);

friendRouter.get(
  "/getmessages/:conversation_id",
  authenticateToken,
  FriendController.getMessages,
);

export default friendRouter;
