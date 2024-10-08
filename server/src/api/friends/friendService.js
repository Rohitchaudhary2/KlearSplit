import { ErrorHandler } from "../middlewares/errorHandler.js";
import UserDb from "../users/userDb.js";
import FriendDb from "./friendDb.js";

class FriendService {
  // Service to add a friend
  static addFriend = async (friendData) => {
    const friendRequestTo = await UserDb.getUserByEmail(friendData.email);
    if (!friendRequestTo) throw new ErrorHandler(404, "User not found");
    const newFriendData = {
      friend1_id: friendData.dataValues.user_id,
      friend2_id: friendRequestTo.user_id,
    };
    const friendExist = await FriendDb.checkFriendExist(newFriendData);
    if (friendExist) throw new ErrorHandler(400, "Friend already exist");
    const friend = await FriendDb.addFriend(newFriendData);
    return friend;
  };

  // Service to get all friends
  static getAllFriends = async (friendData) => {
    const userId = friendData.dataValues.user_id;
    const friends = await FriendDb.getAllFriends(userId);
    return friends;
  };
}

export default FriendService;
