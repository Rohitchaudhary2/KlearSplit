import { Op } from "sequelize";
import Friend from "./models/friendModel.js";
import User from "../users/models/userModel.js";

class FriendDb {
  static addFriend = async (friendData) => await Friend.create(friendData);

  static checkFriendExist = async (friendData) => {
    const result = await Friend.findAll({
      where: {
        [Op.or]: [
          {
            friend1_id: friendData.friend1_id,
            friend2_id: friendData.friend2_id,
          },
          {
            friend1_id: friendData.friend2_id,
            friend2_id: friendData.friend1_id,
          },
        ],
      },
    });
    return result.length > 0;
  };

  // DB query for fetching all the friend
  static getAllFriends = async (userId, filters) => {
    const { status, archival_status, block_status } = filters;

    const whereCondition = {
      [Op.or]: [{ friend1_id: userId }, { friend2_id: userId }],
    };

    // Add filters if provided
    if (status) whereCondition.status = status;
    if (archival_status) whereCondition.archival_status = archival_status;
    if (block_status) whereCondition.block_status = block_status;

    return await Friend.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "friend1",
          attributes: [
            "user_id",
            "first_name",
            "last_name",
            "email",
            "image_url",
          ],
          where: {
            user_id: {
              [Op.ne]: userId,
            },
          },
          required: false,
        },
        {
          model: User,
          as: "friend2",
          attributes: [
            "user_id",
            "first_name",
            "last_name",
            "email",
            "image_url",
          ],
          where: {
            user_id: {
              [Op.ne]: userId,
            },
          },
          required: false,
        },
      ],
    });
  };

  // DB query for fetching friend request
  static getFriend = async (conversation_id) =>
    await Friend.findByPk(conversation_id);

  // DB query for accepting or rejecting friend request
  static acceptRejectFriendRequest = async (friendRequest) => {
    const result = await Friend.update(
      {
        status: friendRequest.status,
      },
      {
        where: {
          conversation_id: friendRequest.conversation_id,
        },
      },
    );
    return result.length > 0;
  };

  // DB query for withdrawing friend request
  static withdrawFriendRequest = async (friendRequest) => {
    const result = await Friend.destroy({
      where: {
        conversation_id: friendRequest.conversation_id,
      },
    });
    return result > 0;
  };

  // DB query to update archival_status or block_status
  static archiveBlockFriend = async (conversation) => {
    const { conversation_id, newStatus, type } = conversation;
    let statusField = type === "archived" ? "archival_status" : "block_status";

    // Update the status
    const updatedStatus = await Friend.update(
      {
        [statusField]: newStatus,
      },
      {
        where: {
          conversation_id,
        },
      },
    );

    return updatedStatus > 0;
  };
}

export default FriendDb;
