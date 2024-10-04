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
}

export default FriendController;
