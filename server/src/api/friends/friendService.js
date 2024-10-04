import { ErrorHandler } from "../middlewares/errorHandler.js";
import UserDb from "../users/userDb.js";
import FriendDb from "./friendDb.js";

class FriendService {
  static addFriend = async (email) => {
    const friendRequestTo = await UserDb.getUserByEmail(email);
    if (!friendRequestTo) throw new ErrorHandler(404, "User not found");
    const friendExist = FriendDb.checkFriendExist(email);
    if (friendExist) throw new ErrorHandler(400, "Friend already exist");
  };
}

export default FriendService;
