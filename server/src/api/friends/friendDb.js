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

  static getAllFriends = async (userId) =>
    await Friend.findAll({
      where: {
        [Op.or]: [
          {
            friend1_id: userId,
          },
          {
            friend2_id: userId,
          },
        ],
      },
      include: [
        {
          model: User,
          as: "friend1", // Alias for friend1
          attributes: ["first_name", "last_name"], // Fetch only first_name
        },
        {
          model: User,
          as: "friend2", // Alias for friend2
          attributes: ["first_name", "last_name"], // Fetch only first_name
        },
      ],
    });
}

export default FriendDb;