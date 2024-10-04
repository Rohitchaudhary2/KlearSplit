import { Op } from "sequelize";
import Friend from "./models/friendModel";

class FriendDb {
  static addFriend = async (friend) => await Friend.create(friend);

  static checkFriendExist = async (friend) =>
    await Friend.findAll({
      where: {
        [Op.or]: [
          { friend1_id: friend.friend1_id, friend2_id: friend.friend2_id },
          { friend1_id: friend.friend2_id, friend2_id: friend.friend1_id },
        ],
      },
    });

  static getFriends = async () => await Friend.findAll();
}

export default FriendDb;
