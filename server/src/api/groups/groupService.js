import { sequelize } from "../../config/db.connection.js";
import crypto from "crypto";
import { ErrorHandler } from "../middlewares/errorHandler.js";
import GroupDb from "./groupDb.js";
import GroupUtils from "./groupUtils.js";
import UserDb from "../users/userDb.js";

class GroupService {
  /**
   * Assigns roles to members and adds them to the group.
    *
    * @param {Object} membersData - The data containing member, admin, and coadmin details.
    * @param {Array} membersData.members - List of members to be added to the group.
    * @param {Array} membersData.admins - List of users to be assigned as admins.
    * @param {Array} membersData.coadmins - List of users to be assigned as coadmins.
    * @param {uuid} inviterId - The ID of the user who is inviting the members to the group.
    * @param {uuid} groupId - The ID of the group where the members are being added.
    * @param {Object} [transaction=null] - An optional Sequelize transaction object for atomic operations.
    *
    * @returns {Promise<Object>} - Returns a promise that resolves with the result of adding members.
    */
  static assignRolesAndAddMembers = async(membersData, inviterId, groupId, transaction = null) => {
    // Assign roles to members using a utility function
    const members = GroupUtils.assignRoles(membersData.members, membersData.admins, membersData.coadmins, inviterId, groupId);

    return await GroupDb.addMembers(members, transaction);
  };

  /**
   * Creates a new group and assigns roles to members, including the group creator.
   *
   * @param {Object} groupData - The data needed to create the group.
   * @param {Object} groupData.group - The group details.
   * @param {Object} groupData.membersData - The data related to members, including their roles (members, admins, coadmins).
   * @param {uuid} userId - The ID of the user who is creating the group.
   *
   * @returns {Promise<Object>} - A promise that resolves with the newly created group object.
   *
   * @throws {ErrorHandler} - Throws an error if any of the operations fail, including group creation or member assignment.
   */
  static createGroup = async(groupData, userId) => {
    Object.assign(groupData.group, { "creator_id": userId });

    const isCreatorInMembors = groupData.membersData.members.some((member) => member === userId);

    if (isCreatorInMembors) {
      throw new ErrorHandler(400, "Creator can't be in members list.");
    }
    
    // Start a new transaction to ensure atomicity
    const transaction = await sequelize.transaction();

    try {
      // Create the group in the database
      const group = await GroupDb.createGroup(groupData.group, transaction);

      if (!group) {
        throw new ErrorHandler(400, "Error while creating group");
      }

      const groupCreatorData = [ {
        "group_id": group.group_id,
        "member_id": group.creator_id,
        "role": "CREATOR",
        "status": "ACCEPTED"
      } ];

      // Add the group creator as a member of the group
      const groupCreator = await GroupDb.addMembers(groupCreatorData, transaction);

      if (groupData.membersData.members.length > 99) {
        throw new ErrorHandler(422, "Only 100 members are allowed.");
      }
      
      // Assign roles to other members and add them to the group
      await this.assignRolesAndAddMembers(groupData.membersData, groupCreator[ 0 ].dataValues.group_membership_id, group.group_id, transaction);

      await transaction.commit();
      return group;
    } catch (error) {
      // Rollback the transaction in case of an error
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Adds members to a group and assigns them roles, ensuring the user inviting the members has the appropriate permissions.
   *
   * @param {Array} membersData - The data of the members to be added to the group, including role and membership details.
   * @param {uuid} userId - The ID of the user who is inviting the new members to the group.
   * @param {uuid} groupId - The ID of the group to which the members are being added.
   *
   * @returns {Promise<Array>} - A promise that resolves to an array of added members with their assigned roles.
   *
   * @throws {ErrorHandler} - Throws an error if:
   *  - The group does not exist (`404`).
   *  - The inviter is not a member or does not have the appropriate permissions (`403`).
   */
  static addMembers = async(membersData, userId, groupId) => {
    // Check if the group exists
    const isGroupExists = await GroupDb.getGroupData(groupId);

    if (!isGroupExists) {
      throw new ErrorHandler(404, "Group does not Exist");
    }

    // Check if the inviter is a member of the group and has appropriate permissions
    const inviter = await GroupDb.getGroupMember(groupId, userId);

    // Throw an error if the inviter does not have membership or appropriate role
    if (!inviter || inviter.has_blocked || inviter.role === "USER") {
      throw new ErrorHandler(403, "You are not allowed to invite members to this group");
    }
    
    let membersBlockedGroup = await GroupDb.getMembersBlockedGroup(groupId, membersData.members);

    membersBlockedGroup = membersBlockedGroup.map((member) => member.member_id);
    let notAddedMembers = [];

    if (membersBlockedGroup) {
      membersData.members = membersData.members.filter((member) => {
        const isBlocked = membersBlockedGroup.includes(member);

        if (isBlocked) {
          notAddedMembers.push(member);
        }
        return !isBlocked;
      });
    }

    notAddedMembers = await UserDb.getUsers(notAddedMembers);

    const groupMembersCount = await GroupDb.countGroupMembers(groupId);
    
    if (groupMembersCount + membersData.members.length > 99) {
      throw new ErrorHandler(422, "Only 100 members are allowed.");
    }

    const addedMembers = await this.assignRolesAndAddMembers(membersData, inviter.group_membership_id, groupId);

    return { addedMembers, notAddedMembers };
  };

  /**
   * Retrieves the groups that a user is part of, categorized by their membership status (accepted or invited).
   *
   * @param {uuid} userId - The ID of the user whose groups are being fetched.
   *
   * @returns {Promise<Object>} - A promise that resolves to an object containing two arrays:
   *  - `acceptedGroups`: An array of groups where the user has an "ACCEPTED" status.
   *  - `invitedGroups`: An array of groups where the user has a "PENDING" (invited) status.
   *
   * @throws {ErrorHandler} - Throws an error if the user's status in the group is not "ACCEPTED" or "PENDING".
   */
  static getUserGroups = async(userId) => {
    // Retrieve the groups of the user from the database
    const groups = await GroupDb.getUserGroups(userId);

    // Reduce the groups into two categories: accepted and invited
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

  /**
   * Checks if a user is a member of a specific group.
   *
   * @param {uuid} groupId - The ID of the group to check the user's membership in.
   * @param {uuid} userId - The ID of the user to check membership for.
   *
   * @returns {Promise<Object>} - A promise that resolves with the user's membership information if they are a member of the group.
   *
   * @throws {ErrorHandler} - Throws an error if the user is not a member of the group.
   */
  static isUserMemberOfGroup = async(groupId, userId) => {
    const userMembershipInfo = await GroupDb.getGroupMember(groupId, userId);

    // If no membership info is found, throw an error indicating the user is not a member
    if (!userMembershipInfo) {
      throw new ErrorHandler(403, "You are not Part of this group");
    }
    return userMembershipInfo.dataValues;
  };

  /**
   * Fetches group data along with the user's membership info and balance details.
   *
   * @param {uuid} groupId - The unique id for the group.
   * @param {uuid} userId - The unique id for the user.
   *
   * @returns {Promise<Array>} - A promise that resolves to the group data, including user membership info and balance details.
   */
  static getGroup = async(groupId, userId) => {
    // Fetch user membership information for the given group and user
    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);

    // Retrieve the group members data using the group ID and the user's membership ID
    const group = await GroupDb.getGroup(groupId, userMembershipInfo.group_membership_id, userMembershipInfo.has_blocked);

    return group;
  };

  /**
   * Updates the data for a specified group.
   *
   * @param {uuid} groupId - The unique identifier of the group to be updated.
   * @param {Object} groupData - The new data for the group. This contains the fields to be updated.
   * @param {uuid} userId - The unique identifier of the user making the update request.
   *
   * @throws {ErrorHandler} - Throws an error if the group is not found or the user is not a member.
   *
   * @returns {Promise<Object>} - A promise that resolves to the updated group data.
   */
  static updateGroup = async(groupId, groupData, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }
    
    // Check if the user is a member of the group. If not, this will throw an error.
    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);

    if (userMembershipInfo.has_blocked) {
      throw new ErrorHandler(400, "You are not allowed to update the group.");
    }

    const updatedGroup = await GroupDb.updateGroup(groupId, groupData);

    return updatedGroup;
  };

  /**
   * Updates the membership data for a specific user in the group.
   *
   * @param {uuid} groupId - The unique identifier of the group where the member's data will be updated.
   * @param {Object} groupMemberData - The data to be updated for the group member (status, role, blocking status).
   * @param {uuid} userId - The unique identifier of the user requesting the membership update.
   *
   * @throws {ErrorHandler} - Throws an error if:
   *   - The group is not found.
   *   - The user is not a member of the group.
   *   - The user attempts to change the membership status after it has been accepted or rejected.
   *
   * @returns {Promise<Object>} - A promise that resolves to the updated group member data.
   */
  static updateGroupMember = async(groupId, groupMemberData, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }
    
    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);

    if (userMembershipInfo.has_blocked && (groupMemberData.status || groupMemberData.role)) {
      throw new ErrorHandler(400, "You cannot update the status or role while the group is blocked.");
    }

    if (groupMemberData.status && userMembershipInfo.status !== "PENDING") {
      throw new ErrorHandler(400, "Status can't be changed once accepted or rejected the group invitation.");
    }

    const updatedMember = GroupDb.updateGroupMember(userMembershipInfo.group_membership_id, groupMemberData);

    return updatedMember;
  };

  /**
   * Saves a new message to the specified group.
   *
   * @param {Object} messageData - messageData which includes messagge to be saved.
   * @param {uuid} groupId - The unique identifier of the group to which the message belongs.
   * @param {uuid} userId - The unique identifier of the user sending the message.
   *
   * @throws {ErrorHandler} - Throws an error if:
   *   - The group is not found.
   *   - The user is not a member of the group.
   *
   * @returns {Promise<Object>} - A promise that resolves to the saved message data.
   */
  static saveMessage = async(messageData, groupId, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }
    
    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);

    if (userMembershipInfo.has_blocked) {
      throw new ErrorHandler(400, "You have blocked the group.");
    }

    const message = GroupDb.saveMessage(messageData, groupId, userMembershipInfo.group_membership_id);

    return message;
  };

  /**
   * Fetches messages from a specified group with pagination.
   *
   * @param {uuid} groupId - The unique identifier of the group from which to fetch messages.
   * @param {uuid} userId - The unique identifier of the user requesting the messages.
   * @param {number} page - The page number for pagination (used to fetch a subset of messages).
   * @param {number} pageSize - The number of messages to fetch per page.
   *
   * @throws {ErrorHandler} - Throws an error if:
   *   - The group is not found.
   *   - The user is not a member of the group.
   *
   * @returns {Promise<Array>} - A promise that resolves to an array of messages from the group.
   */
  static getMessages = async(groupId, userId, pageSize, timestamp) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }
    
    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);

    const updatedTimestamp = userMembershipInfo.has_blocked ? userMembershipInfo.updatedAt : timestamp;

    const messages = GroupDb.getMessages(groupId, pageSize, updatedTimestamp);

    return messages;
  };

  /**
   * Allows a user to leave a specified group.
   *
   * @param {uuid} groupId - The unique identifier of the group the user wishes to leave.
   * @param {uuid} userId - The unique identifier of the user who wants to leave the group.
   *
   * @throws {ErrorHandler} - Throws an error if:
   *   - The group is not found.
   *   - The user is not a member of the group.
   *
   * @returns {Promise<void>} - A promise that resolves when the user has successfully left the group.
   */
  static leaveGroup = async(groupId, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }

    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);

    const balance = await GroupDb.userBalanceInGroup(groupId, userMembershipInfo.group_membership_id).amount;

    if (balance !== 0) {
      throw new ErrorHandler(400, "Settle up before this action. ");
    }

    await GroupDb.leaveGroup(userMembershipInfo.group_membership_id);
  };

  /**
   * Adds an expense to the specified group and updates the balances of debtors.
   *
   * @param {Object} expenseData - The data for the expense, including details like payer_id, payer_share, split_type, debtors, total amount, etc.
   * @param {uuid} groupId - The unique identifier of the group where the expense is being added.
   * @param {uuid} userId - The unique identifier of the user adding the expense (typically the payer).
   *
   * @throws {ErrorHandler} - Throws an error if:
   *   - The group is not found.
   *   - The user is not a member of the group.
   *   - The payer or any debtor is not a member of the group.
   *
   * @returns {Promise<Object>} - A promise that resolves to an object containing the newly created expense and its participants.
   */
  static addExpense = async(expenseData, groupId, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }

    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);

    if (userMembershipInfo.has_blocked) {
      throw new ErrorHandler(400, "You have blocked the group.");
    }

    // Verify that payer is not in the list of debtors
    GroupUtils.isPayerInDebtors(expenseData.debtors, expenseData.payer_id);

    const debtors = GroupUtils.updatedDebtors(expenseData.debtors, expenseData.split_type, expenseData.total_amount, expenseData.payer_share);

    // Removing debtors list and payer_share from expense data and adding group_id expense data
    delete expenseData.debtors;
    delete expenseData.payer_share;
    Object.assign(expenseData, { "group_id": groupId });

    // Verifying that payer and all debtors are valid group members.
    const debtorIds = debtors.map((debtor) => debtor.debtor_id);
    
    const count = await GroupDb.countGroupMembers(groupId, [ expenseData.payer_id, ...debtorIds ]);
    
    if (count !== debtors.length + 1) {
      throw new ErrorHandler(400, "Payer and all debtors must be in group.");
    }

    // Start a new transaction to ensure atomicity
    const transaction = await sequelize.transaction();

    try {
      // Adding expense data in the database
      const expense = await GroupDb.addExpense(expenseData, transaction);

      // Processing data to update balance or insert in members' balance table
      const membersBalance = debtors.map((debtor) => `('${crypto.randomUUID()}', '${groupId}', '${ expenseData.payer_id }', '${debtor.debtor_id}', ${debtor.debtor_amount}, '${new Date().toISOString()}', '${new Date().toISOString()}')`).join(",");

      // const membersBalance = debtors.map((debtor) => [ crypto.randomUUID(), groupId, expenseData.payer_id, debtor.debtor_id, debtor.debtor_amount, new Date(), new Date() ]);

      debtors.forEach((debtor) => Object.assign(debtor, { "group_expense_id": expense.group_expense_id }));

      // Adding expense participnts in database
      const expenseParticipants = await GroupDb.addExpenseParticipants(debtors, transaction);

      // Updating or Insering members balance based on added expense
      await GroupDb.updateMembersBalance(membersBalance, transaction);
      
      await transaction.commit();
      return { expense, expenseParticipants };
    } catch (error) {
      // Rollback the transaction in case of an error
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Adds a settlement between a payer and a debtor in a group and updates their balances.
   *
   * @param {Object} settlementData - The data related to the settlement, including the payer, debtor, and settlement amount.
   * @param {uuid} groupId - The unique identifier of the group where the settlement is taking place.
   * @param {uuid} userId - The unique identifier of the user initiating the settlement (should be the payer).
   *
   * @throws {ErrorHandler} - Throws an error if:
   *   - The group is not found.
   *   - The user is not a member of the group.
   *   - Both the payer and debtor are not members of the group.
   *
   * @returns {Promise<Object>} - A promise that resolves to the created settlement data.
   */
  static addSettlement = async(settlementData, groupId, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }

    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);

    if (userMembershipInfo.has_blocked) {
      throw new ErrorHandler(400, "You have blocked the group.");
    }

    // Verifying that both payer and debtor are members of group.
    const count = await GroupDb.countGroupMembers(groupId, [ settlementData.payer_id, settlementData.debtor_id ]);

    if (count !== 2) {
      throw new ErrorHandler(400, "Both payer and debtor must be in the group.");
    }

    Object.assign(settlementData, { "group_id": groupId });

    const membersBalanceInfo = await GroupDb.getMemberBalance(groupId, settlementData.payer_id, settlementData.debtor_id);

    Object.assign(membersBalanceInfo, { "balance_amount": parseFloat(membersBalanceInfo.balance_amount) });
    
    if (!membersBalanceInfo || membersBalanceInfo.balance_amount === 0) {
      throw new ErrorHandler(400, "All settled.");
    }

    if ((membersBalanceInfo.balance_amount < 0 && membersBalanceInfo.participant1_id !== settlementData.payer_id) || (membersBalanceInfo.balance_amount > 0 && membersBalanceInfo.participant2_id !== settlementData.payer_id)
    ) {
      throw new ErrorHandler(422, "Transaction mismatch: payer is not the correct participant for this balance");
    }

    GroupUtils.validateSettlementAmount(membersBalanceInfo.balance_amount, settlementData.settlement_amount);

    let balanceAmount;

    if (membersBalanceInfo.balance_amount < 0) {
      balanceAmount = membersBalanceInfo.balance_amount + settlementData.settlement_amount;
    } else {
      balanceAmount = membersBalanceInfo.balance_amount - settlementData.settlement_amount;
    }

    Object.assign(membersBalanceInfo, { "balance_amount": balanceAmount });

    // Start a new transaction to ensure atomicity
    const transaction = await sequelize.transaction();

    try {
      // Adding settlement in the database
      const settlement = await GroupDb.addSettlement(settlementData, transaction);

      await membersBalanceInfo.save({ transaction });

      await transaction.commit();

      return settlement;
    } catch (error) {
      // Rollback the transaction in case of an error
      await transaction.rollback();
      throw error;
    }
  };

  /**
 * Fetches and combines the expenses and settlements of a group and returns them in a paginated manner.
 *
 * @param {uuid} groupId - The ID of the group whose expenses and settlements are to be fetched.
 * @param {uuid} userId - The ID of the user requesting the expenses and settlements data.
 * @param {number} [page=1] - The page number for pagination (default is 1).
 * @param {number} [pageSize=20] - The number of items per page (default is 20).
 * @param {number} offset - The offset for the pagination used for determining which slice of data to return.
 * @returns {Promise<Array>} - A paginated list of expenses and settlements combined and sorted by creation date.
 *
 * @throws {ErrorHandler} - Throws an error if the group is not found or if any database query fails.
 */
  static getExpensesSettlements = async(groupId, userId, pageSize = 20, timestamp) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }

    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);
    const updatedTimestamp = userMembershipInfo.has_blocked ? userMembershipInfo.updatedAt : timestamp;
    const expenses = await GroupDb.getExpenses(groupId, userMembershipInfo.group_membership_id, pageSize, updatedTimestamp);
    const settlements = await GroupDb.getSettlements(groupId, pageSize, updatedTimestamp);

    // Combine and sort the results by creation time
    const expensesAndSettlements = [ ...expenses, ...settlements ];

    expensesAndSettlements.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    // Return the paginated results
    
    return expensesAndSettlements.slice(0, 20);
  };

  /**
   * Fetches and combines the messages, expenses, and settlements of a group and returns them in a paginated manner.
   *
   * @param {uuid} groupId - The ID of the group whose messages, expenses, and settlements are to be fetched.
   * @param {uuid} userId - The ID of the user requesting the messages, expenses, and settlements data.
   * @param {number} [page=1] - The page number for pagination (default is 1).
   * @param {number} [pageSize=20] - The number of items per page (default is 20).
   * @param {number} offset - The offset or round for pagination used to determine which slice of data to return.
   * @returns {Promise<Array>} - A paginated list of messages, expenses, and settlements combined and sorted by creation date.
   *
   * @throws {ErrorHandler} - Throws an error if the group is not found or if any database query fails.
   */
  static getMessagesExpensesSettlements = async(groupId, userId, pageSize = 20, timestamp) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }

    const userMembershipInfo = await this.isUserMemberOfGroup(groupId, userId);
    const updatedTimestamp = userMembershipInfo.has_blocked ? userMembershipInfo.updatedAt : timestamp;
    const messages = await GroupDb.getMessages(groupId, pageSize, updatedTimestamp);
    const expenses = await GroupDb.getExpenses(groupId, userMembershipInfo.group_membership_id, pageSize, updatedTimestamp);
    const settlements = await GroupDb.getSettlements(groupId, pageSize, updatedTimestamp);

    // Combine and sort the results by creation time
    const messagesExpensesSettlements = [ ...messages, ...expenses, ...settlements ];

    messagesExpensesSettlements.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    // Return the paginated results
    return messagesExpensesSettlements.slice(0, 20);
  };

  static updateExpense = async(expenseData, groupId, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }

    await this.isUserMemberOfGroup(groupId, userId);

    const previousExpense = await GroupDb.getExpense(expenseData.group_expense_id);

    if (!previousExpense) {
      throw new ErrorHandler(400, "Expense Not Found.");
    }

    
  };

  static updateSettlement = async(settlementData, groupId, userId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }

    await this.isUserMemberOfGroup(groupId, userId);

    const settlement = await GroupDb.getSettlement(settlementData.group_settlement_id);

    if (!settlement) {
      throw new ErrorHandler(400, "Settlement Not Found.");
    }

    const membersBalanceInfo = await GroupDb.getMemberBalance(groupId, settlementData.payer_id, settlementData.debtor_id);

    let balanceAmount;
    
    if (settlement.payer_id === membersBalanceInfo.participant1_id) {
      balanceAmount = membersBalanceInfo.balance_amount - settlement.settlement_amount;

      GroupUtils.validateSettlementAmount(balanceAmount, settlement.settlement_amount);

      balanceAmount = membersBalanceInfo.balance_amount - settlementData.settlement_amount;

    } else {
      balanceAmount = membersBalanceInfo.balance_amount + settlement.settlement_amount;

      GroupUtils.validateSettlementAmount(balanceAmount, settlement.settlement_amount);

      balanceAmount = membersBalanceInfo.balance_amount + settlementData.settlement_amount;
    }

    Object.assign(membersBalanceInfo, { "balance_amount": balanceAmount });
    Object.assign(settlement, settlementData);

    // Start a new transaction to ensure atomicity
    const transaction = await sequelize.transaction();

    try {
      // Adding settlement in the database
      settlement.save({ transaction });

      membersBalanceInfo.save({ transaction });

      await transaction.commit();

      return settlement;
    } catch (error) {
      // Rollback the transaction in case of an error
      await transaction.rollback();
      throw error;
    }
  };

  static deleteExpense = async(groupId, userId, groupExpenseId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }

    await this.isUserMemberOfGroup(groupId, userId);

    await GroupDb.deleteExpense(groupExpenseId);
    await GroupDb.deleteExpenseParticipants(groupExpenseId);
  };

  static deleteSettlement = async(groupId, userId, groupSettlementId) => {
    const group = await GroupDb.getGroupData(groupId);

    if (!group) {
      throw new ErrorHandler(404, "Group Not Found");
    }

    await this.isUserMemberOfGroup(groupId, userId);

    const settlement = await GroupDb.getSettlement(groupSettlementId);

    if (!settlement) {
      throw new ErrorHandler(400, "Settlement not found.");
    }

    const membersBalanceInfo = await GroupDb.getMemberBalance(groupId, settlement.payer_id, settlement.debtor_id);

    if (membersBalanceInfo.participant1_id === settlement.payer_id) {
      const balanceAmount = membersBalanceInfo.balance_amount - settlement.settlement_amount;

      Object.assign(membersBalanceInfo, { "balance_amount": balanceAmount });
    } else {
      const balanceAmount = membersBalanceInfo.balance_amount + settlement.settlement_amount;

      Object.assign(membersBalanceInfo, { "balance_amount": balanceAmount });
    }

    const transaction = await sequelize.transaction();

    try {
      await membersBalanceInfo.save({ transaction });
      await settlement.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };
}

export default GroupService;
