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
  validateParams
} from "../middlewares/validationMiddleware.js";
import uploadMiddleware from "../middlewares/uploadMiddleware.js";

const friendRouter = Router();

// Common Middlewares
// -authenticateToken: Ensures that the user is authenticated
// -validateParams: Validates the `conversation_id` parameter

// Route to send a friend request
// Middleware:
//  - validateEmail: Ensures the provided email is in a valid format
friendRouter.post(
  "/addfriend",
  authenticateToken,
  validateEmail,
  FriendController.addFriend
);

// Route to retrieve all friends for the authenticated user
// Middleware:
//  - validateGetFriends: Validates the filters or parameters for fetching friends
friendRouter.get(
  "/getallfriends",
  authenticateToken,
  validateGetFriends,
  FriendController.getAllFriends
);

// Route to accept or reject a friend request
// Middleware:
//  - validateFriendRequest: Ensures the request has valid acceptance/rejection status
friendRouter.patch(
  "/acceptrejectfriend/:conversation_id",
  authenticateToken,
  validateParams,
  validateFriendRequest,
  FriendController.acceptRejectFriendRequest
);

// Route to withdraw a pending friend request
friendRouter.delete(
  "/withdrawfriendrequest/:conversation_id",
  authenticateToken,
  validateParams,
  FriendController.withdrawFriendRequest
);

// Route to archive or block a friend
// Middleware:
//  - validateArchiveBlockFriend: Validates input for archiving/blocking
friendRouter.patch(
  "/archiveblockfriend/:conversation_id",
  authenticateToken,
  validateParams,
  validateArchiveBlockFriend,
  FriendController.archiveBlockFriend
);

// Route to get messages in a conversation
// Middleware:
//  - validatePagination: Validates pagination parameters
friendRouter.get(
  "/getmessages/:conversation_id",
  authenticateToken,
  validateParams,
  validatePagination,
  FriendController.getMessages
);

// Route to add an expense to a conversation
// Middleware:
//  - uploadMiddleware: Handles file uploads for receipts
//  - validateExpense: Validates the expense data
friendRouter.post(
  "/addexpense/:conversation_id",
  authenticateToken,
  uploadMiddleware("receipts", "receipt"),
  validateParams,
  validateExpense,
  FriendController.addExpense
);

// Route to get all expenses in a conversation
friendRouter.get(
  "/getexpenses/:conversation_id",
  authenticateToken,
  validateParams,
  validatePagination,
  FriendController.getExpenses
);

// Route to update an expense in a conversation
friendRouter.patch(
  "/updateexpense/:conversation_id",
  authenticateToken,
  uploadMiddleware("receipts", "receipt"),
  validateParams,
  validateExpense,
  FriendController.updateExpense
);

// Route to delete an expense from a conversation
friendRouter.delete(
  "/deleteexpense/:conversation_id",
  authenticateToken,
  validateParams,
  FriendController.deleteExpense
);

// Route to get both messages and expenses in a conversation
friendRouter.get(
  "/getboth/:conversation_id",
  authenticateToken,
  validateParams,
  validatePagination,
  FriendController.getBoth
);

export default friendRouter;
