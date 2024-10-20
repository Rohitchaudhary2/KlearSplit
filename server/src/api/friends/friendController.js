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
      const { status, archival_status, block_status } = req.query;
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
      const { conversation_id } = req.params;
      const { user_id } = req.user;
      const { status } = req.body;
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
      const { conversation_id } = req.params;
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
      const { conversation_id } = req.params;
      const { user_id } = req.user;
      const { type } = req.body;
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

  static getMessages = async (req, res, next) => {
    try {
      const { conversation_id } = req.params;
      const messages = await FriendService.getMessages(conversation_id);
      responseHandler(res, 200, "Messages retrieved successfully", messages);
    } catch (error) {
      next(error);
    }
  };

  static addExpense = async (req, res, next) => {
    try {
      const { conversation_id } = req.params;
      const addedExpense = await FriendService.addExpense(
        req.body,
        conversation_id,
      );
      if (addedExpense && addedExpense.message === "You are all settled up.") {
        responseHandler(res, 200, "You are all settled up.", addedExpense);
      } else {
        responseHandler(res, 200, "Expense added successfully", addedExpense);
      }
    } catch (error) {
      next(error);
    }
  };
}

export default FriendController;
