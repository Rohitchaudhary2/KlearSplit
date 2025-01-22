import FriendService from "./friendService.js";
import { responseHandler } from "../utils/responseHandler.js";
import asyncHandler from "./../utils/asyncHandler.js";

class FriendController {
  // Controller to add a friend or send a friend request
  static addFriend = asyncHandler(async(req, res) => {
    const { "user_id": userId, "first_name": firstName, "last_name": lastName } = req.user;
  
    const friendData = await FriendService.addFriend({
      userId,
      firstName,
      lastName,
      ...req.body
    });
  
    responseHandler(res, 201, "Successfully added friend", friendData);
  });

  // Controller to fetch all friends of a user
  static getAllFriends = asyncHandler(async(req, res) => {
    const friendData = await FriendService.getAllFriends(req.user.user_id, req.query);
  
    responseHandler(
      res,
      200,
      "Successfully fetched all friends of a user",
      friendData
    );
  });

  // Controller to accept and reject a friend request
  static acceptRejectFriendRequest = asyncHandler(async(req, res) => {
    const { "conversation_id": conversationId } = req.params;
    const { "user_id": userId } = req.user;
    const { status } = req.body;
  
    const updatedFriendStatus = await FriendService.acceptRejectFriendRequest({
      userId,
      conversationId,
      status
    });
  
    responseHandler(
      res,
      200,
      "Successfully updated friend request status",
      updatedFriendStatus
    );
  });

  // Controller to withdraw a sent friend request
  static withdrawFriendRequest = asyncHandler(async(req, res) => {
    const { "conversation_id": conversationId } = req.params;
    const { "user_id": userId } = req.user;
  
    const deleteFriendRequest = await FriendService.withdrawFriendRequest({
      userId,
      conversationId
    });
  
    responseHandler(
      res,
      200,
      "Successfully withdrew friend request",
      deleteFriendRequest
    );
  });

  // Controller to archive or block a friend
  static archiveBlockFriend = asyncHandler(async(req, res) => {
    const { "conversation_id": conversationId } = req.params;
    const { "user_id": userId } = req.user;
    const { type } = req.body;
    
    const updatedFriendStatus = await FriendService.archiveBlockFriend({
      userId,
      conversationId,
      type
    });
  
    responseHandler(
      res,
      200,
      `Successfully ${type} friend`,
      updatedFriendStatus
    );
  });

  // Controller to fetch messages of a conversation
  static getMessages = asyncHandler(async(req, res) => {
    const { "conversation_id": conversationId } = req.params;
    const { timestamp, pageSize } = req.query;
  
    const messages = await FriendService.getMessages(
      conversationId,
      timestamp,
      pageSize
    );
  
    responseHandler(res, 200, "Messages retrieved successfully", messages);
  });

  // Controller to add an expense
  static addExpense = asyncHandler(async(req, res) => {
    const { "conversation_id": conversationId } = req.params;
    const expenseData = req.body;
    const userId = req.user.user_id;
  
    // Access file data if a file is uploaded
    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/receipts/${req.file.filename}`;

      Object.assign(expenseData, { "receipt_url": imageUrl });
    }
  
    const addedExpense = await FriendService.addExpense(
      expenseData,
      userId,
      conversationId
    );
  
    if (addedExpense && addedExpense.message === "You are all settled up.") {
      responseHandler(res, 200, "You are all settled up.");
    } else {
      responseHandler(res, 200, "Expense added successfully", addedExpense);
    }
  });

  // Controller to fetch expenses
  static getExpenses = asyncHandler(async(req, res) => {
    const { "conversation_id": conversationId } = req.params;
    const { timestamp, pageSize, fetchAll } = req.query;
  
    const expenses = await FriendService.getExpenses(
      conversationId,
      timestamp,
      pageSize,
      fetchAll
    );
  
    responseHandler(res, 200, "Expenses fetched successfully", expenses);
  });

  // Controller to update an expense
  static updateExpense = asyncHandler(async(req, res) => {
    const { "conversation_id": conversationId } = req.params;
    const updatedExpenseData = req.body;
    const userId = req.user.user_id;
  
    // If a file is uploaded, include the file path in the updated expense data
    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/receipts/${req.file.filename}`;

      Object.assign(updatedExpenseData, { "receipt_url": imageUrl });
    }
  
    const updatedExpense = await FriendService.updateExpense(
      updatedExpenseData,
      conversationId,
      userId
    );
  
    responseHandler(res, 200, "Expense updated successfully", updatedExpense);
  });

  // Controller to delete an expense
  static deleteExpense = asyncHandler(async(req, res) => {
    const { "conversation_id": conversationId } = req.params;
    const { "friend_expense_id": friendExpenseId } = req.body;
    const userId = req.user.user_id;
  
    const deletedExpense = await FriendService.deleteExpense(
      conversationId,
      friendExpenseId,
      userId
    );
  
    responseHandler(res, 200, "Expense deleted successfully", deletedExpense);
  });

  // controller to fetch both messages and expenses
  static getBoth = asyncHandler(async(req, res) => {
    const { "conversation_id": conversationId } = req.params;
    const { timestamp, pageSize } = req.query;
  
    const messagesAndExpenses = await FriendService.getBoth(
      conversationId,
      timestamp,
      pageSize
    );
  
    responseHandler(
      res,
      200,
      "Messages and expenses fetched successfully",
      messagesAndExpenses
    );
  });

  static addBulkExpenses = asyncHandler(async(req, res) => {
    const { "conversation_id": conversationId } = req.params;
    const userId = req.user.user_id;
  
    const addedExpenses = await FriendService.addBulkExpenses(conversationId, userId, req);

    responseHandler(res, 200, "Expenses added successfully", addedExpenses);
  });
}

export default FriendController;
