import { responseHandler } from "../utils/responseHandler.js";
import GroupService from "./groupService.js";

class GroupController {
  static createGroup = async(req, res, next) => {
    try {
      const createdGroup = await GroupService.createGroup(req.body);

      responseHandler(res, 201, "Group created successfully", createdGroup);
    } catch (error) {
      next(error);
    }
  };
}

export default GroupController;
