import { Router } from "express";
import FriendController from "./friendController.js";
import { authenticateToken } from "../middlewares/auth.js";
import {
  validateExpense,
  validateArchiveBlockFriend,
  validateEmail,
  validateFriendRequest,
  validateGetFriends,
  validatePagination,
  validateParams,
} from "../middlewares/validationMiddleware.js";

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
  validateGetFriends,
  FriendController.getAllFriends,
);

friendRouter.patch(
  "/acceptrejectfriend/:conversation_id",
  authenticateToken,
  validateParams,
  validateFriendRequest,
  FriendController.acceptRejectFriendRequest,
);

friendRouter.delete(
  "/withdrawfriendrequest/:conversation_id",
  authenticateToken,
  validateParams,
  FriendController.withdrawFriendRequest,
);

friendRouter.patch(
  "/archiveblockfriend/:conversation_id",
  authenticateToken,
  validateParams,
  validateArchiveBlockFriend,
  FriendController.archiveBlockFriend,
);

friendRouter.get(
  "/getmessages/:conversation_id",
  authenticateToken,
  validateParams,
  validatePagination,
  FriendController.getMessages,
);

friendRouter.post(
  "/addexpense/:conversation_id",
  authenticateToken,
  validateParams,
  validateExpense,
  FriendController.addExpense,
);

friendRouter.get(
  "/getexpenses/:conversation_id",
  authenticateToken,
  validateParams,
  validatePagination,
  FriendController.getExpenses,
);

friendRouter.patch(
  "/updateexpense/:conversation_id",
  authenticateToken,
  validateParams,
  validateExpense,
  FriendController.updateExpense,
);

export default friendRouter;
