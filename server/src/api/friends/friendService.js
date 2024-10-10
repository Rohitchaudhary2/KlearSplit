import { ErrorHandler } from "../middlewares/errorHandler.js";
import UserDb from "../users/userDb.js";
import FriendDb from "./friendDb.js";

class FriendService {
  // Service to add a friend
  static addFriend = async (friendData) => {
    const friendRequestTo = await UserDb.getUserByEmail(friendData.email);
    if (!friendRequestTo) throw new ErrorHandler(404, "User not found");
    const newFriendData = {
      friend1_id: friendData.user_id,
      friend2_id: friendRequestTo.user_id,
    };
    const friendExist = await FriendDb.checkFriendExist(newFriendData);
    if (friendExist) throw new ErrorHandler(400, "Friend already exist");
    const friend = await FriendDb.addFriend(newFriendData);
    return friend;
  };

  // Service to get all friends
  static getAllFriends = async (userId, filters) => {
    const friends = await FriendDb.getAllFriends(userId, filters);

    // Map the result to pick the actual friend (either friend1 or friend2)
    return friends.map((friend) => {
      const actualFriend = friend.friend1 || friend.friend2; // Pick the one that's not null
      return {
        conversation_id: friend.conversation_id,
        status: friend.status,
        balance_amount: friend.balance_amount,
        archival_status: friend.archival_status,
        block_status: friend.block_status,
        friendIdentity: friend.friend1 ? "Sender" : "Receiver",
        friend: {
          user_id: actualFriend.user_id,
          first_name: actualFriend.first_name,
          last_name: actualFriend.last_name,
          email: actualFriend.email,
          image_url: actualFriend.image_url,
        },
      };
    });
  };

  // Service to accept and reject friend requests
  static acceptRejectFriendRequest = async (friendRequest) => {
    const { conversation_id } = friendRequest;
    const friendRequestExist = await FriendDb.getFriendRequest(conversation_id);
    if (!friendRequestExist)
      throw new ErrorHandler(404, "Friend request not found");
    if (
      friendRequest.user_id === friendRequest.dataValues.friend2_id &&
      (friendRequest.status === "ACCEPTED" ||
        friendRequest.status === "REJECTED")
    ) {
      const friendRequestUpdate =
        await FriendDb.acceptRejectFriendRequest(friendRequest);
      return friendRequestUpdate;
    }
    throw new ErrorHandler(400, "Invalid request");
  };

  // Service to withdraw friend request
  static withdrawFriendRequest = async (friendRequest) => {
    const { conversation_id } = friendRequest;
    const friendRequestExist = await FriendDb.getFriendRequest(conversation_id);
    if (!friendRequestExist)
      throw new ErrorHandler(404, "Friend request not found");
    if (
      friendRequest.user_id === friendRequestExist.dataValues.friend1_id &&
      friendRequestExist.dataValues.status === "PENDING"
    ) {
      const friendRequestDelete =
        await FriendDb.withdrawFriendRequest(friendRequest);
      return friendRequestDelete;
    }
    throw new ErrorHandler(400, "Invalid request");
  };
}

export default FriendService;
