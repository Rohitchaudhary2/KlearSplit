import { Op } from "sequelize";
import Friend from "./models/friendModel.js";

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
  static getFriends = async () => await Friend.findAll();
}

export default FriendDb;
