import asyncHandler from "../utils/asyncHandler.js";
import { responseHandler } from "../utils/responseHandler.js";
import GroupService from "./groupService.js";

class GroupController {
  // Controller for creating group
  static createGroup = asyncHandler(async(req, res) => {
    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/groupProfile/${req.file.filename}`;

      Object.assign(req.body.group, { "image_url": imageUrl });
    }
    const createdGroup = await GroupService.createGroup(req.body, req.user.user_id);
  
    responseHandler(res, 201, "Group created successfully", createdGroup);
  });

  // Controller adding members in group
  static addMembers = asyncHandler(async(req, res) => {
    const addedMembers = await GroupService.addMembers(req.body.membersData, req.user.user_id, req.body.group_id);
  
    responseHandler(res, 201, "Members added successfully", addedMembers);
  });

  // Controller for getting user specific groups
  static getUserGroups = asyncHandler(async(req, res) => {
    const groups = await GroupService.getUserGroups(req.user.user_id);
  
    responseHandler(res, 200, "Groups fetched successfully", groups);
  });

  // Controller getting members info for a particulr group
  static getGroup = asyncHandler(async(req, res) => {
    const group = await GroupService.getGroup(req.params.group_id, req.user.user_id);
  
    responseHandler(res, 200, "Group fetched successfully", group);
  });

  // Controller for updating group
  static updateGroup = asyncHandler(async(req, res) => {
    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/groupProfile/${req.file.filename}`;

      Object.assign(req.body, { "image_url": imageUrl });
    }
    const group = await GroupService.updateGroup(req.params.group_id, req.body, req.user.user_id);

    responseHandler(res, 200, "Group updated successfully", group);
  });

  // Controller for updating the group member
  static updateGroupMember = asyncHandler(async(req, res) => {
    const updatedMember = await GroupService.updateGroupMember(req.params.group_id, req.body, req.user.user_id);
  
    responseHandler(res, 200, "Group member updated successfully", updatedMember);
  });

  // Controller for saving message in the database
  static saveMessage = asyncHandler(async(req, res) => {
    const message = await GroupService.saveMessage(req.body, req.params.group_id, req.user.user_id);
  
    responseHandler(res, 200, "Message saved successfully", message);
  });

  // Controller for retreiving messages for a particular group
  static getMessages = asyncHandler(async(req, res) => {
    const { pageSize, timestamp } = req.query;
    const messages = await GroupService.getMessages(req.params.group_id, req.user.user_id, pageSize, timestamp);
  
    responseHandler(res, 200, "Messages fetched successfully", messages);
  });

  // Controller for leaving group
  static leaveGroup = asyncHandler(async(req, res) => {
    await GroupService.leaveGroup(req.params.group_id, req.user.user_id);
  
    responseHandler(res, 200, "Group left successfully.");
  });

  // Controller for adding expense
  static addExpense = asyncHandler(async(req, res) => {
    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/groupExpense/${req.file.filename}`;

      Object.assign(req.body, { "receipt_url": imageUrl });
    }
    const expense = await GroupService.addExpense(req.body, req.params.group_id, req.user.user_id);
  
    responseHandler(res, 200, "Expense added successfully", expense);
  });

  // Controller for adding settlement
  static addSettlement = asyncHandler(async(req, res) => {
    const settlement = await GroupService.addSettlement(req.body, req.params.group_id, req.user.user_id);
  
    responseHandler(res, 200, "Settlement added successfully", settlement);
  });

  // Controller retreiving expenses
  static getExpensesSettlements = asyncHandler(async(req, res) => {
    const { pageSize, timestamp, fetchAll } = req.query;
    const expensesSettlements = await GroupService.getExpensesSettlements(req.params.group_id, req.user.user_id, pageSize, timestamp, fetchAll);
  
    responseHandler(res, 200, "Expenses and Settlements fetched successfully", expensesSettlements);
  });

  static getMessagesExpensesSettlements = asyncHandler(async(req, res) => {
    const { pageSize, timestamp } = req.query;
    const messagesExpensesSettlements = await GroupService.getMessagesExpensesSettlements(req.params.group_id, req.user.user_id, pageSize, timestamp);
  
    responseHandler(res, 200, "Messages, expenses, and settlements fetched successfully", messagesExpensesSettlements);
  });

  static updateExpense = asyncHandler(async(req, res) => {
    if (req.file) {
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/groupExpense/${req.file.filename}`;

      Object.assign(req.body, { "receipt_url": imageUrl });
    }
    const updatedExpense = await GroupService.updateExpense(req.body, req.params.group_id, req.user.user_id);
  
    responseHandler(res, 200, "Expense updated successfully", updatedExpense);
  });

  static updateSettlement = asyncHandler(async(req, res) => {
    const updatedSettlement = await GroupService.updateSettlement(req.body, req.params.group_id, req.user.user_id);

    responseHandler(res, 200, "Settlement updated successfully", updatedSettlement);
  });

  static deleteExpense = asyncHandler(async(req, res) => {
    await GroupService.deleteExpense(req.params.group_id, req.user.user_id, req.body.group_expense_id);
    responseHandler(res, 200, "Expense deleted succesfully");
  });

  static deleteSettlement = asyncHandler(async(req, res) => {
    await GroupService.deleteSettlement(req.params.group_id, req.user.user_id, req.body.group_settlement_id);
    responseHandler(res, 200, "Settlement deleted succesfully");
  });
}

export default GroupController;
