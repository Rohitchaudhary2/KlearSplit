import { sequelize } from "../../config/db.connection.js";
import AuditLogService from "../audit/auditService.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";
import UserDb from "../users/userDb.js";
import { auditLogFormat } from "../utils/auditFormat.js";
import { hashedPassword } from "../utils/hashPassword.js";
import logger from "../utils/logger.js";
import { generatePassword } from "../utils/passwordGenerator.js";
import fileData from "../utils/readCsvFile.js";
import sendMail from "../utils/sendMail.js";
import { sendWhatsAppTemplateMessage } from "../utils/whatsappMessage.js";
import validateBulkData from "../utils/validateBulkData.js";
import FriendDb from "./friendDb.js";
import { formatFriendData, getNewStatus, calculateDebtorAmount, calculateNewBalance, validateSettlementAmount, formatPersonName, validateSettlement, isFriendExist, validateExistingExpense, validateConversationPermissions, validateUpdateParticipants, isBalanceUpdateRequired } from "./friendUtils.js";

class FriendService {
  /**
   * Service to add a friend.
   *
   * This method checks if the friend already exists. If not, it creates a new user,
   * sends them an invitation email, and then adds the friend relationship.
   *
   * @param {Object} friendData - The data of the user sending the friend request.
   * @param {string} friendData.email - The email of the user being invited as a friend.
   * @param {string} friendData.firstName - The first name of the user sending the request.
   * @param {string} friendData.lastName - The last name of the user sending the request.
   * @param {UUID} friendData.userId - The ID of the user sending the request.
   *
   * @returns {Promise<Object>} - The friend relationship object, or restores an existing deleted friend request.
   */
  static addFriend = async(friendData) => {
    let friendRequestTo = await UserDb.getUserByEmail(friendData.email);
    const logs = [];

    if (!friendRequestTo) {
      // Generating random password
      const password = generatePassword();

      // Hashing the password
      const hashPassword = await hashedPassword(password);

      friendRequestTo = await UserDb.createUser({
        "first_name": "Invited_Friend",
        "email": friendData.email,
        "is_invited": true,
        "password": hashPassword
      });
      logs.push(auditLogFormat("INSERT", friendData.userId, "users", friendRequestTo.user_id, { "newData": friendRequestTo.dataValues }));

      const options = {
        "email": friendRequestTo.email,
        "subject": "Invited on KlearSplit"
      };
      const sender = `${friendData.firstName} ${friendData.lastName || ""}`.trim();

      sendMail(options, "invitationTemplate", {
        sender
      });
    }

    const newFriendData = {
      "friend1_id": friendData.userId,
      "friend2_id": friendRequestTo.user_id
    };

    if (newFriendData.friend1_id === newFriendData.friend2_id) {
      throw new ErrorHandler(400, "You cannot add yourself as a friend.");
    }

    // Check if the friend already exists and is not deleted
    const friend = await this.checkFriendExist(newFriendData, false);
    
    const oldData = friend ? { ...friend.dataValues } : undefined;

    if (friend && !friend.dataValues.deletedAt) {
      throw new ErrorHandler(409, "Friend already exist");
    }

    // Restore deleted friend request if found
    if (friend && friend.dataValues.deletedAt) {
      const restoredFriend = await FriendDb.restoreFriend(friend);

      logs.push(auditLogFormat("UPDATE", friendData.userId, "friends", restoredFriend.conversation_id, { oldData, "newData": restoredFriend.dataValues }));

      AuditLogService.createLog(logs, true);
      return restoredFriend;
    }

    // Add the friend if no issues
    const newFriend = await FriendDb.addFriend(newFriendData);

    logs.push(auditLogFormat("INSERT", friendData.userId, "friends", newFriend.conversation_id, { "newData": newFriend.dataValues }));

    AuditLogService.createLog(logs, true);

    return newFriend;
  };

  /**
   * Service to check whether a friend already exists.
   *
   * @param {Object} friendData - The data of the friend.
   * @param {boolean} flag - Contains the flag to keep the paranoid field true.
   *
   * @returns {Promise<Object|null>} - The friend data if found, otherwise null.
   */
  static checkFriendExist = async(friendData, flag) =>
    await FriendDb.checkFriendExist(friendData, flag);

  /**
   * Service to get all friends of a user.
   *
   * This method retrieves all friends of a given user and maps them into a user-friendly format.
   *
   * @param {UUID} userId - The ID of the user whose friends are being retrieved.
   * @param {Object} filters - Filters to apply to the friends query (e.g., for pagination).
   * @param {string} [filters.status] - The status filter for the friend relationship.
   * @param {string} [filters.archival_status] - The archival status filter.
   * @param {string} [filters.block_status] - The block status filter.
   * @returns {Promise<Array<Object>>} - An array of friend objects with mapped details.
   */
  static getAllFriends = async(userId, filters) => {
    const friends = await FriendDb.getAllFriends(userId, filters);

    return friends.map(formatFriendData(userId));
  };

  /**
   * Service to accept or reject a friend request.
   *
   * This method updates the status of the friend request based on the provided status and conversation ID.
   *
   * @param {Object} friendRequest - The data of the friend request.
   *
   * @returns {Promise<Object>} - The updated friend request object.
   */
  static acceptRejectFriendRequest = async(friendRequest) => {
    const { conversationId, status } = friendRequest;
    const friendRequestExist = await FriendDb.getFriend(conversationId);

    // If the friend request doesn't exist, throw an error
    if (!friendRequestExist) {
      throw new ErrorHandler(404, "Friend request not found");
    }

    // Check if the user is the one receiving the request and the request is still pending
    if ((friendRequest.userId !== friendRequestExist.dataValues.friend2_id) || (friendRequest.status === "PENDING")) {
      throw new ErrorHandler(400, "Invalid request");
    }

    // Update the status of the friend request
    const friendRequestUpdate = await FriendDb.updateFriends(
      { status },
      conversationId
    );

    const log = auditLogFormat("UPDATE", friendRequest.userId, "friends", conversationId, { "oldData": friendRequestExist.dataValues, "newData": friendRequestUpdate[ 1 ][ 0 ].dataValues });

    AuditLogService.createLog(log);

    return friendRequestUpdate;
  };

  /**
   * Service to withdraw a friend request.
   *
   * This method allows a user to withdraw a friend request that they have sent.
   *
   * @param {Object} friendRequest - The data of the friend request.
   *
   * @returns {Promise<Object>} - The deleted friend request object.
   */
  static withdrawFriendRequest = async(friendRequest) => {
    const { userId, conversationId } = friendRequest;
    const friendRequestExist = await FriendDb.getFriend(conversationId);
    const oldData = { ...friendRequestExist };

    // If the friend request doesn't exist, throw an error
    if (!friendRequestExist) {
      throw new ErrorHandler(404, "Friend request not found");
    }

    // Check if the user is the one who sent the request and it is still pending
    if (
      userId !== friendRequestExist.dataValues.friend1_id || friendRequestExist.dataValues.status !== "PENDING"
    ) {
      throw new ErrorHandler(400, "Invalid request");
    }

    // Withdraw the friend request
    const friendRequestDelete = await FriendDb.withdrawFriendRequest(
      friendRequestExist
    );

    AuditLogService.createLog(auditLogFormat("DELETE", userId, "friends", friendRequestExist.conversation_id, { oldData }));

    return friendRequestDelete;
  };

  /**
   * Service for archiving or blocking, or unarchiving or unblocking a friend.
   *
   * This method toggles the archival or block status of a friend based on the user action.
   *
   * @param {Object} friend - The friend data containing user and status information.
   * @param {UUID} friend.user_id - The ID of the user requesting the change.
   * @param {string} friend.type - The type of action being performed (either "archived" or "blocked").
   * @param {UUID} friend.conversation_id - The ID of the conversation associated with the friend.
   *
   * @returns {Promise<Object>} - The updated friend data after performing the action.
   */
  static archiveBlockFriend = async(friendData) => {
    const { userId, type, conversationId } = friendData;
    
    const friend = await FriendDb.getFriend(conversationId);

    // If the friend doesn't exist, throw an error
    isFriendExist(friend);
    const statusField = type === "archived" ? "archival_status" : "block_status";

    // Determine new status for friend1 or friend2 based on the current status
    const newStatus = userId === friend.dataValues.friend1_id ? getNewStatus("FRIEND1", "FRIEND2", friend[ statusField ]) : getNewStatus("FRIEND2", "FRIEND1", friend[ statusField ]);

    // Do not allow the user to archive or block before the balance_amount is 0
    if (parseFloat(friend.dataValues.balance_amount) !== 0) {
      throw new ErrorHandler(400, "Settle up before this action!");
    }

    // Update the status based on the action
    const friendUpdate = await FriendDb.updateFriends(
      { [ statusField ]: newStatus },
      conversationId
    );
    
    const log = auditLogFormat("UPDATE", userId, "friends", conversationId, { "oldData": friend.dataValues, "newData": friendUpdate[ 1 ][ 0 ].dataValues });
    
    AuditLogService.createLog(log);
    return friendUpdate;
  };

  /**
   * Service to save messages in db
   *
   * Saves a message in the database for a given conversation.
   *
   * @param {Object} messageData - The data of the message to be saved.
   *
   * @returns {Promise<Object>} - The saved message object.
   */
  static saveMessage = async(messageData) => {
    const { "conversation_id": conversationId } = messageData;

    // Check if the conversation exists
    const friend = await FriendDb.getFriend(conversationId);

    isFriendExist(friend);

    // Ensure that the conversation status allows messaging
    if (friend.dataValues.status === "REJECTED") {
      throw new ErrorHandler(400, "Not allowed to send message");
    }

    const message = await FriendDb.addMessage(messageData);

    const log = auditLogFormat("INSERT", messageData.sender_id, "friends_messages", message.message_id, { "newData": message.dataValues });

    AuditLogService.createLog(log);

    return message;
  };

  /**
   * Service to fetch all the messages of a particular conversation
   *
   * Fetches all messages of a given conversation.
   *
   * @param {UUID} conversationId - The ID of the conversation.
   * @param {number} page - The current page number for pagination.
   * @param {number} pageSize - The number of messages per page.
   *
   * @returns {Promise<Array<Object>>} - An array of messages for the conversation.
   */
  static getMessages = async(conversationId, timestamp, pageSize) => {
    // Check if the conversation exists
    const friend = await FriendDb.getFriend(conversationId);

    isFriendExist(friend);

    // Ensure that the conversation status allows messaging
    if (friend.dataValues.status === "REJECTED") {
      throw new ErrorHandler(
        403,
        "You are not allowed to message in this chat."
      );
    }
      
    const messages = await FriendDb.getMessages(
      conversationId,
      timestamp,
      pageSize
    );

    return messages.map((message) => ({
      "message_id": message.dataValues.message_id,
      "sender_id": message.dataValues.sender_id,
      "conversation_id": message.dataValues.conversation_id,
      "message": message.dataValues.message,
      "is_read": message.dataValues.is_read,
      "createdAt": message.dataValues.createdAt
    }));
  };

  /**
   * Service to add expenses in a particular conversation
   *
   * Adds an expense in a conversation, updating balance as necessary.
   *
   * @param {Object} expenseData - The data for the expense.
   * @param {UUID} conversationId - The ID of the conversation.
   *
   * @returns {Promise<Object>} - Returns the saved expense object.
   */
  static addExpense = async(expenseData, userId, conversationId) => {
    const friend = await FriendDb.getFriend(conversationId);
    const friendWithUser = await FriendDb.getFriendWithUsers(conversationId);

    isFriendExist(friend);
    Object.assign(expenseData, { "conversation_id": conversationId });

    // Validate that the conversation allows expenses
    validateConversationPermissions(friend);

    const transaction = await sequelize.transaction();

    try {
      // Calculate debtor amount for the expense
      const debtorAmount = calculateDebtorAmount(expenseData);

      Object.assign(expenseData, { "debtor_amount": debtorAmount });

      // Current balance for the friend relationship
      const currentBalance = parseFloat(friend.balance_amount);

      // Process settlement expenses
      if (expenseData.split_type === "SETTLEMENT") {
        // Check if balance is already settled
        if (currentBalance === 0) {
          return { "message": "You are all settled up." };
        }
        validateSettlementAmount(currentBalance, debtorAmount);
        Object.assign(expenseData, { "expense_name": "Settlement" });

        // Determine payer and debtor based on balance direction
        Object.assign(expenseData, { "payer_id": currentBalance > 0 ? friend.friend2_id : friend.friend1_id });
        Object.assign(expenseData, { "debtor_id": currentBalance > 0 ? friend.friend1_id : friend.friend2_id });
      }

      // Prevent self-expenses
      if (expenseData.payer_id === expenseData.debtor_id) {
        throw new ErrorHandler(400, "You cannot add an expense with yourself");
      }

      // Verify that the payer is part of the conversation
      if (
        expenseData.payer_id !== friend.friend1_id && expenseData.payer_id !== friend.friend2_id
      ) {
        throw new ErrorHandler(
          403,
          "You are not allowed to add expense in this chat."
        );
      }

      const logs = [];

      const expense = await FriendDb.addExpense(expenseData, transaction);

      logs.push(auditLogFormat("INSERT", userId, "friends_expenses", expense.friend_expense_id, { "newData": expense.dataValues }));

      // Calculate the new balance based on the expense details
      const balanceAmount = calculateNewBalance(
        currentBalance,
        debtorAmount,
        expenseData.payer_id,
        friend,
        expenseData.split_type
      );

      // Update balance between friends
      const updatedFriends = await FriendDb.updateFriends(
        { "balance_amount": balanceAmount },
        conversationId,
        transaction
      );

      logs.push(auditLogFormat("UPDATE", userId, "friends", updatedFriends[ 1 ][ 0 ].conversation_id, { "oldData": updatedFriends[ 1 ][ 0 ]._previousDataValues, "newData": updatedFriends[ 1 ][ 0 ].dataValues }));

      const participantDetails = [
        friendWithUser.dataValues.friend1.dataValues,
        friendWithUser.dataValues.friend2.dataValues
      ];
      
      // Send WhatsApp messages
      const responses = await sendWhatsAppTemplateMessage(participantDetails, expense);

      if (responses.error) {
        responses.forEach((response) => {
          logger.log({
            "level": "error",
            "message": JSON.stringify({
              "statusCode": response.statusCode,
              "message": response.error.message
            })
          });
        });
      }

      await transaction.commit();
      AuditLogService.createLog(logs, true);

      return expense;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Service to fetch all expenses for a conversation
   *
   * Retrieves all expenses associated with a conversation.
   *
   * @param {UUID} conversationId - The ID of the conversation.
   * @param {number} timestamp - The current timestamp.
   * @param {number} pageSize - The number of expenses per page.
   * @param {boolean} fetchAll - Flag indicating whether to fetch all expenses.
   * @returns {Promise<Array<Object>>} - Returns an array of expense objects.
   */
  static getExpenses = async(conversationId, timestamp, pageSize, fetchAll) => {
    const friend = await FriendDb.getFriend(conversationId);

    isFriendExist(friend);

    // Ensure that you are allowed to view the expense
    if (friend.status === "REJECTED") {
      throw new ErrorHandler(
        403,
        "You are not allowed to view this conversation."
      );
    }

    const expenses = await FriendDb.getExpenses(
      conversationId,
      timestamp,
      pageSize,
      fetchAll
    );

    return expenses.map((expense) => {
      return {
        ...expense.dataValues,
        "payer": `${expense.payer.first_name} ${expense.payer.last_name || ""}`.trim()
      };
    });
  };

  /**
   * Service to update a friend expense
   *
   * Updates an existing expense in a conversation. Handles balance recalculations
   * if balance-affecting fields are modified.
   *
   * @param {Object} updatedExpenseData - The updated data for the expense.
   * @param {UUID} conversationId - The ID of the conversation.
   *
   * @returns {Promise<Object>} - Returns the updated expense object.
   */
  static updateExpense = async(updatedExpenseData, conversationId, userId) => {
    const friend = await FriendDb.getFriend(conversationId);

    isFriendExist(friend);
  
    const existingExpense = await FriendDb.getExpense(updatedExpenseData.friend_expense_id);

    validateExistingExpense(existingExpense);
  
    validateConversationPermissions(friend);
    validateUpdateParticipants(updatedExpenseData, friend);
  
    const balanceAffectingFields = [
      "total_amount",
      "payer_id",
      "debtor_id",
      "split_type",
      "participant1_share",
      "participant2_share",
      "debtor_share"
    ];
  
    const requiresBalanceUpdate = isBalanceUpdateRequired(balanceAffectingFields, updatedExpenseData);
  
    if (!requiresBalanceUpdate) {
      return await this.handleNonBalanceUpdate(updatedExpenseData, userId);
    }
  
    return await this.handleBalanceUpdate(updatedExpenseData, friend, existingExpense, userId);
  };

  /**
   * Handles non-balance updates.
   */
  static handleNonBalanceUpdate = async(updatedExpenseData, userId) => {
    const { affectedRows, updatedExpense } = await FriendDb.updateExpense(
      updatedExpenseData,
      updatedExpenseData.friend_expense_id
    );

    if (affectedRows === 0) {
      throw new ErrorHandler(400, "Failed to update expense");
    }
    AuditLogService.createLog(auditLogFormat("UPDATE", userId, "friends_expenses", updatedExpense.friend_expense_id, { "oldData": updatedExpense._previousDataValues, "newData": updatedExpense.dataValues }));

    updatedExpense.dataValues.payer = formatPersonName(updatedExpense.payer);
    return updatedExpense;
  };

  /**
   * Handles balance updates with a transaction.
   */
  static handleBalanceUpdate = async(updatedExpenseData, friend, existingExpense, userId) => {
    const transaction = await sequelize.transaction();

    try {
      const debtorAmount = calculateDebtorAmount(updatedExpenseData, existingExpense);

      Object.assign(updatedExpenseData, { "debtor_amount": debtorAmount });

      const currentBalance = parseFloat(friend.balance_amount);

      validateSettlement(updatedExpenseData, currentBalance, debtorAmount);

      const newBalance = calculateNewBalance(
        currentBalance,
        debtorAmount,
        updatedExpenseData.payer_id || existingExpense.payer_id,
        friend,
        updatedExpenseData.split_type || existingExpense.split_type,
        existingExpense,
        true
      );

      const { affectedRows, updatedExpense } = await FriendDb.updateExpense(
        updatedExpenseData,
        updatedExpenseData.friend_expense_id,
        transaction
      );
      
      const logs = [];

      if (affectedRows === 0) {
        throw new ErrorHandler(400, "Failed to update expense");
      }
      
      logs.push(auditLogFormat("UPDATE", userId, "friends_expenses", updatedExpenseData.friend_expense_id, { "oldData": existingExpense.dataValues, "newData": updatedExpense.dataValues }));

      const updatedFriends = await FriendDb.updateFriends(
        { "balance_amount": newBalance },
        friend.conversation_id,
        transaction
      );

      logs.push(auditLogFormat("UPDATE", userId, "friends", updatedFriends[ 1 ][ 0 ].conversation_id, { "oldData": friend.dataValues, "newData": updatedFriends[ 1 ][ 0 ].dataValues }));
      await transaction.commit();
      AuditLogService.createLog(logs, true);

      updatedExpense.dataValues.payer = formatPersonName(updatedExpense.payer);
      return updatedExpense;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Service to delete a friend expense
   *
   * Deletes an expense from a conversation. Updates the balance if necessary.
   *
   * @param {UUID} conversationId - The ID of the conversation.
   * @param {UUID} friendExpenseId - The ID of the expense to delete.
   *
   * @returns {Promise<Object>} - Returns a success message upon deletion.
   */
  static deleteExpense = async(conversationId, friendExpenseId, userId) => {
    const friend = await FriendDb.getFriend(conversationId);

    isFriendExist(friend);

    const existingExpense = await FriendDb.getExpense(friendExpenseId);

    validateExistingExpense(existingExpense);

    // Verify that the expense belongs to the current conversation
    if (friend.conversation_id !== existingExpense.conversation_id) {
      throw new ErrorHandler(403, "You are not allowed to delete this expense");
    }

    const transaction = await sequelize.transaction();
    const logs = [];

    try {
      // Update the is_deleted field
      const { updatedExpense } = await FriendDb.updateExpense(
        { "is_deleted": 2 },
        friendExpenseId,
        transaction
      );

      logs.push(auditLogFormat("UPDATE", userId, "friends_expenses", updatedExpense.friend_expense_id, { "oldData": existingExpense.dataValues, "newData": updatedExpense.dataValues }));

      // Delete the expense
      const { affectedRows } = await FriendDb.deleteExpense(
        friendExpenseId,
        transaction
      );

      if (affectedRows === 0) {
        throw new ErrorHandler(400, "Failed to delete expense");
      }

      logs.push(auditLogFormat("DELETE", userId, "friends_expenses", updatedExpense.friend_expense_id, { "oldData": updatedExpense.dataValues }));

      // Update the balance in the friends table
      const updatedFriends = await FriendDb.updateFriends(
        {
          "balance_amount":
            existingExpense.payer_id === friend.friend1_id ? parseFloat(friend.balance_amount) - parseFloat(existingExpense.debtor_amount) : parseFloat(friend.balance_amount) + parseFloat(existingExpense.debtor_amount)
        },
        conversationId,
        transaction
      );

      logs.push(auditLogFormat("UPDATE", userId, "friends", updatedFriends[ 1 ][ 0 ].conversation_id, { "oldData": friend.dataValues, "newData": updatedFriends[ 1 ][ 0 ].dataValues }));
      AuditLogService.createLog(logs, true);
      // Commit the transaction
      await transaction.commit();
      return { "message": "Expense deleted successfully" };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Service to fetch both expenses and messages together
   *
   * Fetches both expenses and messages for a conversation, sorted by creation time.
   * Supports pagination and dynamically adjusts page numbers for messages and expenses
   * once the current batch is exhausted.
   *
   * @param {UUID} conversationId - The ID of the conversation.
   * @param {number} [timestamp] - The timestamp.
   * @param {number} [pageSize=20] - The number of items per page (default: 20).
   *
   * @returns {Promise<Array<Object>>} - Returns an array of expenses and messages.
   */
  static getBoth = async(conversationId, timestamp, pageSize = 20) => {
    let timeStamp = timestamp;
    const results = [];
    const [ messages, expenses ] = await Promise.all([
      this.getMessages(conversationId, timeStamp, pageSize),
      this.getExpenses(conversationId, timeStamp, pageSize)
    ]);
    
    while (results.length < pageSize) {
      
      // Break if no more data to fetch
      if (!messages.length && !expenses.length) {
        break;
      }
  
      // Merge messages and expenses, and update the timestamp
      const nextItem = this.getNextItem(messages, expenses);

      results.push(nextItem);
      
      // Update timestamp to the createdAt of the next item added
      timeStamp = nextItem.createdAt;
    }
  
    return results;
  };
  
  // Helper function to merge and pick the next item
  static getNextItem = (messages, expenses) => {
    if (messages.length && (!expenses.length || messages[ 0 ].createdAt >= expenses[ 0 ].createdAt)) {
      return messages.shift();
    }
    return expenses.shift();
  };
  
  static addBulkExpenses = async(conversationId, userId, req) => {
    const friend = await FriendDb.getFriend(conversationId);

    isFriendExist(friend);
    validateConversationPermissions(friend);

    let validRows = [];
    
    const rows = await fileData(req);

    const tableName = req.body.tableName;

    let processedRows;
    const errorsOccured = [];

    if (rows) {
      // Use Promise.all to wait for all the promises to resolve
      processedRows = await Promise.all(
        rows.map(async(row, index) => {
          const payer = await UserDb.getUserByEmail(row[ "Payer Email ID" ].trim());
          const debtor = await UserDb.getUserByEmail(row[ "Debtor Email ID" ].trim());
          const processedRow = {
            "expense_name": row.Name.trim(),
            "conversation_id": conversationId.trim(),
            "total_amount": row.Amount.trim(),
            "split_type": row[ "Split Type" ].trim(),
            "payer_id": payer.user_id,
            "debtor_id": debtor.user_id,
            "participant1_share": row[ "Payer Share" ].trim(),
            "participant2_share": row[ "Debtor Share" ].trim(),
            "debtor_share": row[ "Debtor Share" ].trim()
          };
          
          let debtorAmount;

          try {
            debtorAmount = calculateDebtorAmount(processedRow);
          } catch (error) {
            errorsOccured.push({
              "row": index + 1,
              "errors": error.message
            });
          }

          Object.assign(processedRow, { "debtor_amount": debtorAmount });

          // Prevent self-expenses
          if (processedRow.payer_id === processedRow.debtor_id) {
            errorsOccured.push({
              "row": index + 1,
              "errors": "You cannot add an expense with yourself"
            });
          }

          // Verify that the payer is part of the conversation
          if (
            processedRow.payer_id !== friend.friend1_id && processedRow.payer_id !== friend.friend2_id
          ) {
            errorsOccured.push({
              "row": index + 1,
              "errors": "You are not allowed to add expense in this chat."
            });
          }

          return processedRow;
        })
      );
      if (errorsOccured.length) {
        throw new ErrorHandler(400, errorsOccured);
      }
      validRows = await validateBulkData(processedRows, tableName);
    }
    
    let expenses;

    if (validRows.length === rows.length) {
      const transaction = await sequelize.transaction();

      try {
        expenses = await FriendDb.bulkAddExpenses(validRows, transaction);
        expenses.forEach((expense) => {
          let balanceAmount = parseFloat(friend.balance_amount);

          balanceAmount += expenses.payer_id === friend.participant1_id ? parseFloat(expense.debtor_amount) : -parseFloat(expense.debtor_amount);

          Object.assign(friend, { "balance_amount": balanceAmount });
        });
        await friend.save({ transaction });
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }
    return expenses;
  };
}

export default FriendService;
