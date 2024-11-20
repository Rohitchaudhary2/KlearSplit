import FriendService from "./friendService.js";
import { responseHandler } from "../utils/responseHandler.js";

class FriendController {
  // Controller to add a friend or send a friend request
  static addFriend = async(req, res, next) => {
    const { "user_id": userId, "first_name": firstName, "last_name": lastName } = req.user;

    try {
      const friendData = await FriendService.addFriend({
        userId,
        firstName,
        lastName,
        ...req.validatedUser
      });

      responseHandler(res, 201, "Successfully added friend", friendData);
    } catch (error) {
      next(error);
    }
  };

  // Controller to fetch all friends of a user
  static getAllFriends = async(req, res, next) => {
    try {
      const friendData = await FriendService.getAllFriends(req.user.user_id, req.validatedFriends);

      responseHandler(
        res,
        200,
        "Successfully fetched all friends of a user",
        friendData
      );
    } catch (error) {
      next(error);
    }
  };

  // Controller to accept and reject a friend request
  static acceptRejectFriendRequest = async(req, res, next) => {
    try {
      const { "conversation_id": conversationId } = req.validatedParams;
      const { "user_id": userId } = req.user;
      const { status } = req.validatedFriend;
      const updatedFriendStatus = await FriendService.acceptRejectFriendRequest(
        { userId, conversationId, status }
      );

      responseHandler(
        res,
        200,
        "Successfully updated friend request status",
        updatedFriendStatus
      );
    } catch (error) {
      next(error);
    }
  };

  // Controller to withdraw a sent friend request
  static withdrawFriendRequest = async(req, res, next) => {
    try {
      const { "conversation_id": conversationId } = req.validatedParams;
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
    } catch (error) {
      next(error);
    }
  };

  // Controller to archive or block a friend
  static archiveBlockFriend = async(req, res, next) => {
    try {
      const { "conversation_id": conversationId } = req.validatedParams;
      const { "user_id": userId } = req.user;
      const { type } = req.validatedFriend;
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
    } catch (error) {
      next(error);
    }
  };

  // Controller to fetch messages of a conversation
  static getMessages = async(req, res, next) => {
    try {
      const { "conversation_id": conversationId } = req.validatedParams;
      const { page, pageSize } = req.validatedPagination;
      const messages = await FriendService.getMessages(
        conversationId,
        page,
        pageSize
      );

      responseHandler(res, 200, "Messages retrieved successfully", messages);
    } catch (error) {
      next(error);
    }
  };

  // Controller to add an expense
  static addExpense = async(req, res, next) => {
    try {
      const { "conversation_id": conversationId } = req.validatedParams;
      let expenseData = req.validatedExpense; // Access the form data here

      // Access file data if a file is uploaded
      if (req.file) {
        expenseData = Object.assign(expenseData, { "receipt_url": req.file.path });
      }
      const addedExpense = await FriendService.addExpense(
        expenseData,
        conversationId
      );

      if (addedExpense && addedExpense.message === "You are all settled up.") {
        responseHandler(res, 200, "You are all settled up.");
      } else {
        responseHandler(res, 200, "Expense added successfully", addedExpense);
      }
    } catch (error) {
      next(error);
    }
  };

  // Controller to fetch expenses
  static getExpenses = async(req, res, next) => {
    try {
      const { "conversation_id": conversationId } = req.validatedParams;
      const { page, pageSize, fetchAll } = req.validatedPagination;
      const expenses = await FriendService.getExpenses(
        conversationId,
        page,
        pageSize,
        fetchAll
      );

      responseHandler(res, 200, "Expenses fetched successfully", expenses);
    } catch (error) {
      next(error);
    }
  };

  // Controller to update an expense
  static updateExpense = async(req, res, next) => {
    try {
      const { "conversation_id": conversationId } = req.validatedParams;
      let updatedExpenseData = req.validatedExpense;
      // Access file data if a file is uploaded

      if (req.file) {
        updatedExpenseData = Object.assign(updatedExpenseData, { "receipt_url": req.file.path });
      }
      const updatedExpense = await FriendService.updateExpense(
        updatedExpenseData,
        conversationId
      );

      responseHandler(res, 200, "Expense updated successfully", updatedExpense);
    } catch (error) {
      next(error);
    }
  };

  // Controller to delete an expense
  static deleteExpense = async(req, res, next) => {
    try {
      const { "conversation_id": conversationId } = req.validatedParams;
      const { "friend_expense_id": friendExpenseId } = req.body;
      const deletedExpense = await FriendService.deleteExpense(
        conversationId,
        friendExpenseId
      );

      responseHandler(res, 200, "Expense deleted successfully", deletedExpense);
    } catch (error) {
      next(error);
    }
  };

  // controller to fetch both messages and expenses
  static getBoth = async(req, res, next) => {
    try {
      const { "conversation_id": conversationId } = req.validatedParams;
      const { page, pageSize } = req.validatedPagination;
      const messagesAndExpenses = await FriendService.getBoth(
        conversationId,
        page,
        pageSize
      );

      responseHandler(
        res,
        200,
        "Messages and expenses fetched successfully",
        messagesAndExpenses
      );
    } catch (error) {
      next(error);
    }
  };
}

export default FriendController;
