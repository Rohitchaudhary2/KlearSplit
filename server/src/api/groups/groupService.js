import { ErrorHandler } from "../middlewares/errorHandler.js";
import GroupDb from "./groupDb.js";
import GroupUtils from "./groupUtils.js";

class GroupService {
  // Function to assign roles and add members in group
  static assignRolesAndAddMembers = async(membersData, inviterId, groupId) => {
    const members = GroupUtils.assignRoles(membersData.members, membersData.admins, membersData.coadmins, inviterId, groupId);

    return await GroupDb.addMembers(members);
  };

  // Service to create group
  static createGroup = async(groupData, userId) => {
    Object.assign(groupData.group, { "creator_id": userId });
    
    const group = await GroupDb.createGroup(groupData.group);

    if (!group) {
      throw new ErrorHandler(400, "Error while creating group");
    }

    const groupCreatorData = [ {
      "group_id": group.group_id,
      "member_id": group.creator_id,
      "role": "CREATOR",
      "status": "ACCEPTED"
    } ];

    const groupCreator = await GroupDb.addMembers(groupCreatorData);
    
    await this.assignRolesAndAddMembers(groupData.membersData, groupCreator[ 0 ].dataValues.group_membership_id, group.group_id);
    return group;
  };

  // Service to add members to the group
  static addMembers = async(membersData, userId, groupId) => {
    const isGroupExists = await GroupDb.getGroupData(groupId);

    if (!isGroupExists) {
      throw new ErrorHandler(404, "Group does not Exist");
    }

    const inviter = await GroupDb.getGroupMember(groupId, userId);

    if (!inviter || inviter.role === "USER") {
      throw new ErrorHandler(403, "You are not allowed to invite members to this group");
    }

    const addedMembers = await this.assignRolesAndAddMembers(membersData, inviter.group_membership_id, groupId);

    return addedMembers;
  };

  // Service to get logged in user's groups
  static getUserGroups = async(userId) => {
    const groups = await GroupDb.getUserGroups(userId);

    const { acceptedGroups, invitedGroups } = groups.reduce((acc, val) => {
      switch (val.status) {
        case "ACCEPTED":
          acc.acceptedGroups.push(val);
          break;
        case "PENDING":
          acc.invitedGroups.push(val);
          break;
        default:
          throw new ErrorHandler(500, "Wrong status");
      }
      return acc;
    }, { "acceptedGroups": [], "invitedGroups": [] });

    return { acceptedGroups, invitedGroups };
  };

  // Function to check whether user is member of group or not
  static isUserMemberOfGroup = async(groupId, userId) => {
    const userMembershipInfo = await GroupDb.getGroupMember(groupId, userId);

    if (!userMembershipInfo) {
      throw new ErrorHandler(403, "You are not Part of this group");
    }
    return userMembershipInfo.dataValues;
  };

  // Service to particular group's members and their balance data
  static getGroup = async(groupId, userId) => {
    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);

    const group = await GroupDb.getGroup(groupId, userMembershipInfo.group_membership_id);

    group.push({ ...userMembershipInfo, "balance_with_user": 0, "total_balance": 0 });

    return group;
  };

  // Service to update group information
  static updateGroup = async(groupId, groupData, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }
    
    await this.isUserMemberOfGroup(groupId, userId);

    const updatedGroup = await GroupDb.updateGroup(groupId, groupData);

    return updatedGroup;
  };

  // Service to update group member's data like status, role, has_archived fields.
  static updateGroupMember = async(groupId, groupMemberData, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }
    
    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);

    if (groupMemberData.status && userMembershipInfo.status !== "PENDING") {
      throw new ErrorHandler(400, "Status can't be changed once accepted or rejected the group invitation.");
    }

    const updatedMember = GroupDb.updateGroupMember(userMembershipInfo.group_membership_id, groupMemberData);

    return updatedMember;
  };

  // Service to save message
  static saveMessage = async(messageData, groupId, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }
    
    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);

    const message = GroupDb.saveMessage(messageData, groupId, userMembershipInfo.group_membership_id);

    return message;
  };

  // Service to get messages for a particular group
  static getMessages = async(groupId, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }
    
    await this.isUserMemberOfGroup(groupId, userId);

    const messages = GroupDb.getMessages(groupId);

    return messages;
  };

  // Service to leave group
  static leaveGroup = async(groupId, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }

    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);

    await GroupDb.leaveGroup(userMembershipInfo.group_membership_id);
  };

  // Service to add expense
  static addExpense = async(expenseData, groupId, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }

    await this.isUserMemberOfGroup(groupId, userId);

    GroupUtils.isPayerInDebtors(expenseData.debtors, expenseData.payer_id);

    const debtors = GroupUtils.updatedDebtors(expenseData.debtors, expenseData.split_type, expenseData.total_amount, expenseData.payer_share);

    delete expenseData.debtors;
    delete expenseData.payer_share;
    Object.assign(expenseData, { "group_id": groupId });

    const expense = await GroupDb.addExpense(expenseData);

    debtors.forEach((debtor) => Object.assign(debtor, { "group_expense_id": expense.group_expense_id }));

    const expenseParticipants = await GroupDb.addExpenseParticipants(debtors);
    
    return { expense, expenseParticipants };
  };

  // Service to get expenses
  static getExpenses = async(groupId, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }

    await this.isUserMemberOfGroup(groupId, userId);
    const expenses = await GroupDb.getExpenses(groupId);

    return expenses;
  };
}

export default GroupService;
