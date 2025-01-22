import { Router } from "express";
import FriendController from "./friendController.js";
import { authenticateToken } from "../middlewares/auth.js";
import {
  validateExpense,
  validateParams,
  validateBody,
  validateQuery
} from "../middlewares/validationMiddleware.js";
import * as friendsSchema from "./friendValidations.js";
import uploadMiddleware from "../middlewares/uploadMiddleware.js";
import { emailSchema } from "../users/userValidations.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ErrorHandler } from "../middlewares/errorHandler.js";

const __dirname = path.resolve();

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { "recursive": true });
  }
};

const storage = multer.diskStorage({
  "destination": function(req, file, cb) {
    const uploadPath = path.resolve(__dirname, "/uploads/csv");

    // Ensure the directory exists before storing the file
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  "filename": function(req, file, cb) {
    const uniqueSuffix = `${Date.now() }-${ Math.round(Math.random() * 1e9)}`;

    cb(null, `${file.fieldname }-${ uniqueSuffix}`);
  }
});

// file filter function to only allow CSV files.
const filterFile = (req, file, cb) => {
  const extName = path.extname(file.originalname).toLocaleLowerCase();

  if (extName !== ".csv") {
    return cb(new ErrorHandler("Only csv files are allowed", 400), false);
  }
  return cb(null, true);
};
const upload = multer({ "storage": storage, "fileFilter": filterFile });

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
  validateBody(emailSchema),
  FriendController.addFriend
);

// Route to retrieve all friends for the authenticated user
// Middleware:
//  - validateGetFriends: Validates the filters or parameters for fetching friends
friendRouter.get(
  "/getallfriends",
  authenticateToken,
  validateQuery(friendsSchema.getFriendsValidation),
  FriendController.getAllFriends
);

// Route to accept or reject a friend request
// Middleware:
//  - validateFriendRequest: Ensures the request has valid acceptance/rejection status
friendRouter.patch(
  "/acceptrejectfriend/:conversation_id",
  authenticateToken,
  validateParams(friendsSchema.uuidParamValidation),
  validateBody(friendsSchema.acceptRejectFriendRequestValidation),
  FriendController.acceptRejectFriendRequest
);

// Route to withdraw a pending friend request
friendRouter.delete(
  "/withdrawfriendrequest/:conversation_id",
  authenticateToken,
  validateParams(friendsSchema.uuidParamValidation),
  FriendController.withdrawFriendRequest
);

// Route to archive or block a friend
// Middleware:
//  - validateArchiveBlockFriend: Validates input for archiving/blocking
friendRouter.patch(
  "/archiveblockfriend/:conversation_id",
  authenticateToken,
  validateParams(friendsSchema.uuidParamValidation),
  validateBody(friendsSchema.archiveBlockFriendValidation),
  FriendController.archiveBlockFriend
);

// Route to get messages in a conversation
// Middleware:
//  - validatePagination: Validates pagination parameters
friendRouter.get(
  "/getmessages/:conversation_id",
  authenticateToken,
  validateParams(friendsSchema.uuidParamValidation),
  validateQuery(friendsSchema.paginationValidation),
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
  validateParams(friendsSchema.uuidParamValidation),
  validateExpense,
  FriendController.addExpense
);

// Route to get all expenses in a conversation
friendRouter.get(
  "/getexpenses/:conversation_id",
  authenticateToken,
  validateParams(friendsSchema.uuidParamValidation),
  validateQuery(friendsSchema.paginationValidation),
  FriendController.getExpenses
);

// Route to update an expense in a conversation
friendRouter.patch(
  "/updateexpense/:conversation_id",
  authenticateToken,
  uploadMiddleware("receipts", "receipt"),
  validateParams(friendsSchema.uuidParamValidation),
  validateExpense,
  FriendController.updateExpense
);

// Route to delete an expense from a conversation
friendRouter.delete(
  "/deleteexpense/:conversation_id",
  authenticateToken,
  validateParams(friendsSchema.uuidParamValidation),
  FriendController.deleteExpense
);

// Route to get both messages and expenses in a conversation
friendRouter.get(
  "/getboth/:conversation_id",
  authenticateToken,
  validateParams(friendsSchema.uuidParamValidation),
  validateQuery(friendsSchema.paginationValidation),
  FriendController.getBoth
);

friendRouter.post("/expenses-bulkcreate/:conversation_id", authenticateToken, upload.single("file"), validateParams(friendsSchema.uuidParamValidation), FriendController.addBulkExpenses);

export default friendRouter;
