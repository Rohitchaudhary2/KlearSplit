import { responseHandler } from "../utils/responseHandler.js";
import GroupService from "./groupService.js";

class GroupController {
  // Controller for creating group
  static createGroup = async(req, res, next) => {
    try {
      if (req.file) {
        Object.assign(req.body, { "image_url": req.file.path });
      }
      const createdGroup = await GroupService.createGroup(req.body, req.user.user_id);

      responseHandler(res, 201, "Group created successfully", createdGroup);
    } catch (error) {
      next(error);
    }
  };

  // Controller adding members in group
  static addMembers = async(req, res, next) => {
    try {
      const addedMembers = await GroupService.addMembers(req.body.membersData, req.user.user_id, req.body.group_id);

      responseHandler(res, 201, "Members added successfully", addedMembers);
    } catch (error) {
      next(error);
    }
  };

  // Controller for getting user specific groups
  static getUserGroups = async(req, res, next) => {
    try {
      const groups = await GroupService.getUserGroups(req.user.user_id);

      responseHandler(res, 200, "Groups fetched successfully", groups);
    } catch (error) {
      next(error);
    }
  };

  // Controller getting members info for a particulr group
  static getGroup = async(req, res, next) => {
    try {
      const group = await GroupService.getGroup(req.params.group_id, req.user.user_id);

      responseHandler(res, 200, "Group fetched successfully", group);
    } catch (error) {
      next(error);
    }
  };

  // Controller for updating group
  static updateGroup = async(req, res, next) => {
    try {
      const group = await GroupService.updateGroup(req.params.group_id, req.body, req.user.user_id);

      responseHandler(res, 200, "Group updated successfully", group);
    } catch (error) {
      next(error);
    }
  };

  // Controller for updating the group member
  static updateGroupMember = async(req, res, next) => {
    try {
      const updatedMember = await GroupService.updateGroupMember(req.params.group_id, req.body, req.user.user_id);

      responseHandler(res, 200, "Group member updated successfully", updatedMember);
    } catch (error) {
      next(error);
    }
  };

  // Controller for saving message in the database
  static saveMessage = async(req, res, next) => {
    try {
      const message = await GroupService.saveMessage(req.body, req.params.group_id, req.user.user_id);

      responseHandler(res, 200, "Message saved successfully", message);
    } catch (error) {
      next(error);
    }
  };

  // Controller for retreiving messages for a particular group
  static getMessages = async(req, res, next) => {
    try {
      const { page, pageSize } = req.query;
      const messages = await GroupService.getMessages(req.params.group_id, req.user.user_id, page, pageSize);
      
      responseHandler(res, 200, "Messages fetched successfully", messages);
    } catch (error) {
      next(error);
    }
  };

  // Controller for leaving group
  static leaveGroup = async(req, res, next) => {
    try {
      await GroupService.leaveGroup(req.params.group_id, req.user.user_id);

      responseHandler(res, 200, "Group left successfully.");
    } catch (error) {
      next(error);
    }
  };

  // Controller for adding expense
  static addExpense = async(req, res, next) => {
    try {
      if (req.file) {
        Object.assign(req.body, { "receipt_url": req.file.path });
      }
      const expense = await GroupService.addExpense(req.body, req.params.group_id, req.user.user_id);

      responseHandler(res, 200, "Expense added successfully", expense);
    } catch (error) {
      next(error);
    }
  };

  // Controller for adding settlement
  static addSettlement = async(req, res, next) => {
    try {
      const settlement = await GroupService.addSettlement(req.body, req.params.group_id, req.user.user_id);

      responseHandler(res, 200, "Expense added successfully", settlement);
    } catch (error) {
      next(error);
    }
  };

  // Controller retreiving expenses
  static getExpenses = async(req, res, next) => {
    try {
      const { page, pageSize } = req.query;
      const expenses = await GroupService.getExpenses(req.body.group_id, req.user.user_id, page, pageSize);

      responseHandler(res, 200, "Expense fetched successfully", expenses);
    } catch (error) {
      next(error);
    }
  };
}

export default GroupController;
