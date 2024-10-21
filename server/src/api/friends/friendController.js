import FriendService from "./friendService.js";
import { responseHandler } from "../utils/responseHandler.js";

class FriendController {
  // Controller to add friend or send friend request
  static addFriend = async (req, res, next) => {
    const { user_id } = req.user;
    try {
      const friendData = await FriendService.addFriend(res, {
        user_id,
        ...req.validatedUser,
      });
      responseHandler(res, 201, "Successfully added friend", friendData);
    } catch (error) {
      next(error);
    }
  };

  // Controller for fetching friends
  static getAllFriends = async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const { status, archival_status, block_status } = req.validatedFriends;
      const friendData = await FriendService.getAllFriends(user_id, {
        status,
        archival_status,
        block_status,
      });
      responseHandler(
        res,
        200,
        "Successfully fetched all friends of a user",
        friendData,
      );
    } catch (error) {
      next(error);
    }
  };

  // Controller to accept and reject friend request
  static acceptRejectFriendRequest = async (req, res, next) => {
    try {
      const { conversation_id } = req.validatedParams;
      const { user_id } = req.user;
      const { status } = req.validatedFriend;
      const updatedFriendStatus = await FriendService.acceptRejectFriendRequest(
        { user_id, conversation_id, status },
      );
      responseHandler(
        res,
        200,
        "Successfully updated friend request status",
        updatedFriendStatus,
      );
    } catch (error) {
      next(error);
    }
  };

  // Controller for withdrawing friend request
  static withdrawFriendRequest = async (req, res, next) => {
    try {
      const { conversation_id } = req.validatedParams;
      const { user_id } = req.user;
      const deleteFriendRequest = await FriendService.withdrawFriendRequest({
        user_id,
        conversation_id,
      });
      responseHandler(
        res,
        200,
        "Successfully withdrew friend request",
        deleteFriendRequest,
      );
    } catch (error) {
      next(error);
    }
  };

  // Controller for archive/block friend
  static archiveBlockFriend = async (req, res, next) => {
    try {
      const { conversation_id } = req.validatedParams;
      const { user_id } = req.user;
      const { type } = req.validatedFriend;
      const updatedFriendStatus = await FriendService.archiveBlockFriend({
        user_id,
        conversation_id,
        type,
      });
      responseHandler(
        res,
        200,
        `Successfully ${type} friend`,
        updatedFriendStatus,
      );
    } catch (error) {
      next(error);
    }
  };

  // Controller for get friend messages
  static getMessages = async (req, res, next) => {
    try {
      const { conversation_id } = req.validatedParams;
      const { page = 1, pageSize = 10 } = req.validatedPagination;
      const messages = await FriendService.getMessages(
        conversation_id,
        parseInt(page),
        parseInt(pageSize),
      );
      responseHandler(res, 200, "Messages retrieved successfully", messages);
    } catch (error) {
      next(error);
    }
  };

  // Controller for add expense
  static addExpense = async (req, res, next) => {
    try {
      const { conversation_id } = req.validatedParams;
      const addedExpense = await FriendService.addExpense(
        req.validatedExpense,
        conversation_id,
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

  // Controller for fetching expenses
  static getExpenses = async (req, res, next) => {
    try {
      const { conversation_id } = req.validatedParams;
      const { page = 1, pageSize = 10 } = req.validatedPagination;
      const expenses = await FriendService.getExpenses(
        conversation_id,
        page,
        pageSize,
      );
      responseHandler(res, 200, "Expenses fetched successfully", expenses);
    } catch (error) {
      next(error);
    }
  };
}

export default FriendController;
