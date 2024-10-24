import { Op } from "sequelize";
import Friend from "./models/friendModel.js";
import User from "../users/models/userModel.js";
import FriendMessage from "./models/friendMessageModel.js";
import FriendExpense from "./models/friendExpenseModel.js";

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

  // DB query to update friend
  static updateFriends = async (
    updatedData,
    conversation_id,
    transaction = null,
  ) =>
    await Friend.update(updatedData, {
      where: {
        conversation_id,
      },
      transaction,
      returning: true,
    });

  // DB query for withdrawing friend request
  static withdrawFriendRequest = async (friendRequest) => {
    const result = await Friend.destroy({
      where: {
        conversation_id: friendRequest.conversation_id,
      },
    });
    return result > 0;
  };

  // DB query to add messages
  static addMessage = async (messageData) =>
    await FriendMessage.create(messageData);

  // Db query to fetch all the messages of a particular conversation
  static getMessages = async (conversation_id) =>
    await FriendMessage.findAll({
      where: {
        conversation_id,
      },
    });

  // DB query for add expenses
  static addExpense = async (expenseData, transaction) =>
    await FriendExpense.create(expenseData, { transaction });
}

export default FriendDb;
