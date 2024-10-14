import sequelize from "../../config/db.connection.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";
import UserDb from "../users/userDb.js";
import { responseHandler } from "../utils/responseHandler.js";
import FriendDb from "./friendDb.js";

class FriendService {
  // Service to add a friend
  static addFriend = async (res, friendData) => {
    const friendRequestTo = await UserDb.getUserByEmail(friendData.email);
    if (!friendRequestTo) throw new ErrorHandler(404, "User not found");
    const newFriendData = {
      friend1_id: friendData.user_id,
      friend2_id: friendRequestTo.user_id,
    };
    const friendExist = await this.checkFriendExist(newFriendData);
    if (friendExist)
      responseHandler(res, 409, "Friend already exist", friendExist);
    const friend = await FriendDb.addFriend(newFriendData);
    return friend;
  };

  // Service to check whether friend already exists
  static checkFriendExist = async (friendData) =>
    await FriendDb.checkFriendExist(friendData);

  // Service to get all friends
  static getAllFriends = async (userId, filters) => {
    const friends = await FriendDb.getAllFriends(userId, filters);

    // Map the result to pick the actual friend (either friend1 or friend2)
    return friends.map((friend) => {
      const actualFriend = friend.friend1 || friend.friend2; // Pick the one that's not null
      return {
        conversation_id: friend.conversation_id,
        status: friend.friend1 ? "SENDER" : "RECEIVER",
        balance_amount: friend.balance_amount,
        archival_status: friend.archival_status,
        block_status: friend.block_status,
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
    const friendRequestExist = await FriendDb.getFriend(conversation_id);
    if (!friendRequestExist)
      throw new ErrorHandler(404, "Friend request not found");
    if (
      friendRequest.user_id === friendRequestExist.dataValues.friend2_id &&
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
    const friendRequestExist = await FriendDb.getFriend(conversation_id);
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

  // Service for archiving/blocking or unarchiving/unblocking a friend
  static archiveBlockFriend = async (friend) => {
    const { user_id, type, conversation_id } = friend;
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend doesn't exist");
    const statusField =
      type === "archived" ? "archival_status" : "block_status";

    let newStatus;
    if (user_id === friendExist.dataValues.friend1_id) {
      if (friendExist[statusField] === "NONE") {
        newStatus = "FRIEND1";
      } else if (friendExist[statusField] === "FRIEND2") {
        newStatus = "BOTH";
      } else if (friendExist[statusField] === "FRIEND1") {
        newStatus = "NONE";
      } else if (friendExist[statusField] === "BOTH") {
        newStatus = "FRIEND2";
      } else {
        throw new ErrorHandler(400, "Invalid status field");
      }
    } else {
      if (friendExist[statusField] === "NONE") {
        newStatus = "FRIEND2";
      } else if (friendExist[statusField] === "FRIEND1") {
        newStatus = "BOTH";
      } else if (friendExist[statusField] === "FRIEND2") {
        newStatus = "NONE";
      } else if (friendExist[statusField] === "BOTH") {
        newStatus = "FRIEND1";
      } else {
        throw new ErrorHandler(400, "Invalid status field");
      }
    }
    if (parseFloat(friendExist.dataValues.balance_amount) === 0) {
      const friendUpdate = await FriendDb.archiveBlockFriend({
        conversation_id,
        newStatus,
        type,
      });
      return friendUpdate;
    }
    throw new ErrorHandler(400, "Invalid request");
  };

  static saveMessage = async (messageData) => {
    const { conversation_id } = messageData;
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend doesn't exist");
    if (friendExist.dataValues.status !== "ACCEPTED")
      throw new ErrorHandler(400, "Not allowed to send message");

    const transaction = await sequelize.transaction();

    try {
      const message = await FriendDb.addMessage(messageData, transaction);

      const fullMessage = await FriendDb.getMessage(
        message.message_id,
        transaction,
      );
      await transaction.commit();

      return {
        message_id: fullMessage.dataValues.message_id,
        sender_id: fullMessage.dataValues.sender_id,
        sender: fullMessage.dataValues.sender.dataValues.first_name,
        conversation_id: fullMessage.dataValues.conversation_id,
        message: fullMessage.dataValues.message,
        is_read: fullMessage.dataValues.is_read,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  static getMessages = async (conversation_id) => {
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend doesn't exist");
    if (friendExist.dataValues.status !== "ACCEPTED")
      throw new ErrorHandler(404, "No messages allowed");
    const messages = await FriendDb.getMessages(conversation_id);

    return messages.map((message) => {
      return {
        message_id: message.dataValues.message_id,
        sender_id: message.dataValues.sender_id,
        sender: message.dataValues.sender.dataValues.first_name,
        conversation_id: message.dataValues.conversation_id,
        message: message.dataValues.message,
        is_read: message.dataValues.is_read,
      };
    });
  };
}

export default FriendService;
