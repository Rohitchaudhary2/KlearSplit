import FriendService from "./friendService.js";
import { responseHandler } from "../utils/responseHandler.js";

class FriendController {
  static addFriend = async (req, res, next) => {
    try {
      const friendData = await FriendService.addFriend({
        ...req.user,
        ...req.validatedUser,
      });
      responseHandler(res, 201, "Successfully added friend", friendData);
    } catch (error) {
      next(error);
    }
  };

  static getAllFriends = async (req, res, next) => {
    try {
      const friendData = await FriendService.getAllFriends(req.user);
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

  static acceptRejectFriendRequest = async (req, res, next) => {
    try {
      const { conversation_id, status } = req.body;
      const { user_id } = req.user;
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
}

export default FriendController;
