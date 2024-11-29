import { responseHandler } from "../utils/responseHandler.js";
import GroupService from "./groupService.js";

class GroupController {
  static createGroup = async(req, res, next) => {
    try {
      const createdGroup = await GroupService.createGroup(req.validatedGroupData, req.user.user_id);

      responseHandler(res, 201, "Group created successfully", createdGroup);
    } catch (error) {
      next(error);
    }
  };

  static addMembers = async(req, res, next) => {
    try {
      const addedMembers = await GroupService.addMembers(req.validatedMembersData.membersData, req.user.user_id, req.validatedMembersData.group_id);

      responseHandler(res, 201, "Members added successfully", addedMembers);
    } catch (error) {
      next(error);
    }
  };

  static getUserGroups = async(req, res, next) => {
    try {
      const groups = await GroupService.getUserGroups(req.user.user_id);

      responseHandler(res, 200, "Groups fetched successfully", groups);
    } catch (error) {
      next(error);
    }
  };

  static getGroup = async(req, res, next) => {
    try {
      const group = await GroupService.getGroup(req.validatedParams.group_id, req.user.user_id);

      responseHandler(res, 200, "Group fetched successfully", group);
    } catch (error) {
      next(error);
    }
  };
}

export default GroupController;
