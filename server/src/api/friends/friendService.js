import { sequelize } from "../../config/db.connection.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";
import UserDb from "../users/userDb.js";
import { hashedPassword } from "../utils/hashPassword.js";
import { generatePassword } from "../utils/passwordGenerator.js";
import sendMail from "../utils/sendMail.js";
import FriendDb from "./friendDb.js";

class FriendService {
  /**
   * Service to add a friend.
   *
   * This method checks if the friend already exists. If not, it creates a new user,
   * sends them an invitation email, and then adds the friend relationship.
   *
   * @param {Object} friendData - The data of the user sending the friend request.
   * @param {string} friendData.email - The email of the user being invited as a friend.
   * @param {string} friendData.first_name - The first name of the user sending the request.
   * @param {string} friendData.last_name - The last name of the user sending the request.
   * @param {UUID} friendData.user_id - The ID of the user sending the request.
   *
   * @returns {Promise<Object>} - The friend relationship object, or restores an existing deleted friend request.
   */
  static addFriend = async (friendData) => {
    let friendRequestTo = await UserDb.getUserByEmail(friendData.email);
    if (!friendRequestTo) {
      //Generating random password
      const password = generatePassword();

      //Hashing the password
      const hashPassword = await hashedPassword(password);
      friendRequestTo = await UserDb.createUser({
        first_name: "Invited_Friend",
        email: friendData.email,
        is_invited: true,
        password: hashPassword,
      });

      const options = {
        email: friendRequestTo.email,
        subject: "Invited on KlearSplit",
      };

      const sender = `${friendData.first_name}${friendData.last_name ? ` ${friendData.last_name}` : ""}`;

      sendMail(options, "invitationTemplate", {
        name: friendRequestTo.first_name,
        sender,
      });
    }

    const newFriendData = {
      friend1_id: friendData.user_id,
      friend2_id: friendRequestTo.user_id,
    };
    if (newFriendData.friend1_id === newFriendData.friend2_id)
      throw new ErrorHandler(400, "You cannot add yourself as a friend.");

    // Check if the friend already exists and is not deleted
    const friendExist = await this.checkFriendExist(newFriendData, false);
    if (friendExist && !friendExist.dataValues.deletedAt)
      throw new ErrorHandler(409, "Friend already exist");

    // Restore deleted friend request if found
    if (friendExist && friendExist.dataValues.deletedAt) {
      return await FriendDb.restoreFriend(friendExist);
    }

    // Add the friend if no issues
    const friend = await FriendDb.addFriend(newFriendData);
    return friend;
  };

  /**
   * Service to check whether a friend already exists.
   *
   * @param {Object} friendData - The data of the friend.
   * @param {boolean} flag - Contains the flag to keep the paranoid field true.
   *
   * @returns {Promise<Object|null>} - The friend data if found, otherwise null.
   */
  static checkFriendExist = async (friendData, flag) =>
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
  static getAllFriends = async (userId, filters) => {
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
  static acceptRejectFriendRequest = async (friendRequest) => {
    const { conversation_id, status } = friendRequest;
    const friendRequestExist = await FriendDb.getFriend(conversation_id);

    // If the friend request doesn't exist, throw an error
    if (!friendRequestExist)
      throw new ErrorHandler(404, "Friend request not found");

    // Check if the user is the one receiving the request and the request is still pending
    if (
      friendRequest.user_id !== friendRequestExist.dataValues.friend2_id ||
      friendRequest.status === "PENDING"
    ) {
      throw new ErrorHandler(400, "Invalid request");
    }

    // Update the status of the friend request
    const friendRequestUpdate = await FriendDb.updateFriends(
      { status },
      conversation_id,
    );
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
  static withdrawFriendRequest = async (friendRequest) => {
    const { conversation_id } = friendRequest;
    const friendRequestExist = await FriendDb.getFriend(conversation_id);

    // If the friend request doesn't exist, throw an error
    if (!friendRequestExist)
      throw new ErrorHandler(404, "Friend request not found");

    // Check if the user is the one who sent the request and it is still pending
    if (
      friendRequest.user_id !== friendRequestExist.dataValues.friend1_id ||
      friendRequestExist.dataValues.status !== "PENDING"
    ) {
      throw new ErrorHandler(400, "Invalid request");
    }

    // Withdraw the friend request
    const friendRequestDelete = await FriendDb.withdrawFriendRequest(
      friendRequest,
      friendRequestExist,
    );
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
  static archiveBlockFriend = async (friend) => {
    const { user_id, type, conversation_id } = friend;
    const friendExist = await FriendDb.getFriend(conversation_id);

    // If the friend doesn't exist, throw an error
    if (!friendExist) throw new ErrorHandler(404, "Friend doesn't exist");
    const statusField =
      type === "archived" ? "archival_status" : "block_status";

    let newStatus;
    // Determine new status for friend1 or friend2 based on the current status
    if (user_id === friendExist.dataValues.friend1_id) {
      if (friendExist[statusField] === "NONE") {
        newStatus = "FRIEND1";
      } else if (friendExist[statusField] === "FRIEND2") {
        newStatus = "BOTH";
      } else if (friendExist[statusField] === "FRIEND1") {
        newStatus = "NONE";
      } else if (friendExist[statusField] === "BOTH") {
        newStatus = "FRIEND2";
      } else {
        throw new ErrorHandler(400, "Invalid status field");
      }
    } else {
      if (friendExist[statusField] === "NONE") {
        newStatus = "FRIEND2";
      } else if (friendExist[statusField] === "FRIEND1") {
        newStatus = "BOTH";
      } else if (friendExist[statusField] === "FRIEND2") {
        newStatus = "NONE";
      } else if (friendExist[statusField] === "BOTH") {
        newStatus = "FRIEND1";
      } else {
        throw new ErrorHandler(400, "Invalid status field");
      }
    }

    // Do not allow the user to archive or block before the balance_amount is 0
    if (parseFloat(friendExist.dataValues.balance_amount) !== 0) {
      throw new ErrorHandler(400, "Settle up before this action!");
    }

    // Update the status based on the action
    const friendUpdate = await FriendDb.updateFriends(
      { [statusField]: newStatus },
      conversation_id,
    );
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
  static saveMessage = async (messageData) => {
    const { conversation_id } = messageData;

    // Check if the conversation exists
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend doesn't exist");

    // Ensure that the conversation status allows messaging
    if (friendExist.dataValues.status === "REJECTED")
      throw new ErrorHandler(400, "Not allowed to send message");

    const message = await FriendDb.addMessage(messageData);

    return message;
  };

  /**
   * Service to fetch all the messages of a particular conversation
   *
   * Fetches all messages of a given conversation.
   *
   * @param {UUID} conversation_id - The ID of the conversation.
   * @param {number} page - The current page number for pagination.
   * @param {number} pageSize - The number of messages per page.
   *
   * @returns {Promise<Array<Object>>} - An array of messages for the conversation.
   */
  static getMessages = async (conversation_id, page, pageSize) => {
    // Check if the conversation exists
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend doesn't exist");

    // Ensure that the conversation status allows messaging
    if (friendExist.dataValues.status === "REJECTED")
      throw new ErrorHandler(
        403,
        "You are not allowed to message in this chat.",
      );
    const messages = await FriendDb.getMessages(
      conversation_id,
      page,
      pageSize,
    );

    return messages.map((message) => {
      return {
        message_id: message.dataValues.message_id,
        sender_id: message.dataValues.sender_id,
        conversation_id: message.dataValues.conversation_id,
        message: message.dataValues.message,
        is_read: message.dataValues.is_read,
        createdAt: message.dataValues.createdAt,
      };
    });
  };

  /**
   * Service to add expenses in a particular conversation
   *
   * Adds an expense in a conversation, updating balance as necessary.
   *
   * @param {Object} expenseData - The data for the expense.
   * @param {UUID} conversation_id - The ID of the conversation.
   *
   * @returns {Promise<Object>} - Returns the saved expense object.
   */
  static addExpense = async (expenseData, conversation_id) => {
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend not found");
    expenseData.conversation_id = conversation_id;

    // Validate that the conversation allows expenses
    if (
      friendExist.status === "REJECTED" ||
      friendExist.archival_status !== "NONE" ||
      friendExist.block_status !== "NONE"
    ) {
      throw new ErrorHandler(403, "This action is not allowed.");
    }

    const transaction = await sequelize.transaction();
    try {
      // Calculate debtor amount for the expense
      const debtorAmount = calculateDebtorAmount(expenseData);
      expenseData.debtor_amount = debtorAmount;

      // Current balance for the friend relationship
      const currentBalance = parseFloat(friendExist.balance_amount);

      // Process settlement expenses
      if (expenseData.split_type === "SETTLEMENT") {
        // Check if balance is already settled
        if (currentBalance === 0) {
          return { message: "You are all settled up." };
        }
        validateSettlementAmount(currentBalance, debtorAmount);
        expenseData.expense_name = "Settlement";

        // Determine payer and debtor based on balance direction
        expenseData.payer_id =
          currentBalance > 0 ? friendExist.friend2_id : friendExist.friend1_id;
        expenseData.debtor_id =
          currentBalance > 0 ? friendExist.friend1_id : friendExist.friend2_id;
      }

      // Prevent self-expenses
      if (expenseData.payer_id === expenseData.debtor_id) {
        throw new ErrorHandler(400, "You cannot add an expense with yourself");
      }

      // Verify that the payer is part of the conversation
      if (
        expenseData.payer_id !== friendExist.friend1_id &&
        expenseData.payer_id !== friendExist.friend2_id
      ) {
        throw new ErrorHandler(
          403,
          "You are not allowed to add expense in this chat.",
        );
      }

      const expense = await FriendDb.addExpense(expenseData, transaction);

      // Calculate the new balance based on the expense details
      const balanceAmount = calculateNewBalance(
        currentBalance,
        debtorAmount,
        expenseData.payer_id,
        friendExist,
        expenseData.split_type,
      );

      // Update balance between friends
      await FriendDb.updateFriends(
        { balance_amount: balanceAmount },
        conversation_id,
        transaction,
      );
      await transaction.commit();

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
   * @param {UUID} conversation_id - The ID of the conversation.
   * @param {number} page - The current page of expenses to retrieve.
   * @param {number} pageSize - The number of expenses per page.
   * @param {boolean} fetchAll - Flag indicating whether to fetch all expenses.
   * @returns {Promise<Array<Object>>} - Returns an array of expense objects.
   */
  static getExpenses = async (conversation_id, page, pageSize, fetchAll) => {
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend not found");

    // Ensure that you are allowed to view the expense
    if (friendExist.status === "REJECTED") {
      throw new ErrorHandler(
        403,
        "You are not allowed to view this conversation.",
      );
    }

    const expenses = await FriendDb.getExpenses(
      conversation_id,
      page,
      pageSize,
      fetchAll,
    );

    const expensesToSend = expenses.map((expense) => expense.toJSON());

    // Format expense data with payer's full name
    return expensesToSend.map((expense) => ({
      ...expense,
      payer:
        `${expense.payer.first_name} ${expense.payer.last_name || ""}`.trim(),
    }));
  };

  /**
   * Service to update a friend expense
   *
   * Updates an existing expense in a conversation. Handles balance recalculations
   * if balance-affecting fields are modified.
   *
   * @param {Object} updatedExpenseData - The updated data for the expense.
   * @param {UUID} conversation_id - The ID of the conversation.
   *
   * @returns {Promise<Object>} - Returns the updated expense object.
   */
  static updateExpense = async (updatedExpenseData, conversation_id) => {
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) {
      throw new ErrorHandler(404, "Friend not found");
    }
    const existingExpense = await FriendDb.getExpense(
      updatedExpenseData.friend_expense_id,
    );
    if (!existingExpense) {
      throw new ErrorHandler(404, "Expense not found");
    }

    // Validate that the conversation allows expenses
    if (
      friendExist.status === "REJECTED" ||
      friendExist.archival_status !== "NONE" ||
      friendExist.block_status !== "NONE"
    ) {
      throw new ErrorHandler(403, "This action is not allowed.");
    }

    // Don't allow to update the expense if not part of the conversation
    if (
      !(
        (existingExpense.payer_id === friendExist.friend1_id &&
          existingExpense.debtor_id === friendExist.friend2_id) ||
        (existingExpense.payer_id === friendExist.friend2_id &&
          existingExpense.debtor_id === friendExist.friend1_id)
      )
    ) {
      throw new ErrorHandler(403, "You are not allowed to update this expense");
    }

    const balanceAffectingFields = [
      "total_amount",
      "payer_id",
      "debtor_id",
      "split_type",
      "participant1_share",
      "participant2_share",
      "debtor_share",
    ];

    // Check if balance-related fields are being updated
    const requiresBalanceUpdate = balanceAffectingFields.some(
      (field) => field in updatedExpenseData,
    );

    // Only non-balance fields are being updated, skip transaction
    if (!requiresBalanceUpdate) {
      const { affectedRows, updatedExpense } = await FriendDb.updateExpense(
        updatedExpenseData,
        updatedExpenseData.friend_expense_id,
      );

      if (affectedRows === 0)
        throw new ErrorHandler(400, "Failed to update expense");

      // Format the payer's name in the response
      updatedExpense.dataValues.payer =
        `${updatedExpense.payer.first_name} ${updatedExpense.payer.last_name || ""}`.trim();
      return updatedExpense;
    }

    // Balance-related fields need an update, use a transaction
    const transaction = await sequelize.transaction();
    try {
      const debtorAmount = calculateDebtorAmount(
        updatedExpenseData,
        existingExpense,
      );
      updatedExpenseData.debtor_amount = debtorAmount;

      const currentBalance = parseFloat(friendExist.balance_amount);

      // Handle settlement split type
      if (updatedExpenseData.split_type === "SETTLEMENT") {
        if (currentBalance === 0) {
          throw new ErrorHandler(400, "You are all settled up.");
        }
        validateSettlementAmount(currentBalance, debtorAmount);
      }

      // Prevent self-expense
      if (
        updatedExpenseData.payer_id &&
        updatedExpenseData.debtor_id &&
        updatedExpenseData.payer_id === updatedExpenseData.debtor_id
      ) {
        throw new ErrorHandler(400, "You cannot add an expense with yourself");
      }

      const newBalance = calculateNewBalance(
        currentBalance,
        debtorAmount,
        updatedExpenseData.payer_id || existingExpense.payer_id,
        friendExist,
        updatedExpenseData.split_type || existingExpense.split_type,
        existingExpense,
        true,
      );

      // Update the expense with a transaction
      const { affectedRows, updatedExpense } = await FriendDb.updateExpense(
        updatedExpenseData,
        updatedExpenseData.friend_expense_id,
        transaction,
      );

      if (affectedRows === 0)
        throw new ErrorHandler(400, "Failed to update expense");

      // Update the balance in the friends table
      await FriendDb.updateFriends(
        { balance_amount: newBalance },
        friendExist.conversation_id,
        transaction,
      );

      // Commit the transaction
      await transaction.commit();

      // Format the payer's name in the response
      updatedExpense.dataValues.payer =
        `${updatedExpense.payer.first_name} ${updatedExpense.payer.last_name || ""}`.trim();
      return updatedExpense;
    } catch (error) {
      // Rollback the transaction in case of any error
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Service to delete a friend expense
   *
   * Deletes an expense from a conversation. Updates the balance if necessary.
   *
   * @param {UUID} conversation_id - The ID of the conversation.
   * @param {UUID} friend_expense_id - The ID of the expense to delete.
   *
   * @returns {Promise<Object>} - Returns a success message upon deletion.
   */
  static deleteExpense = async (conversation_id, friend_expense_id) => {
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend not found");

    const existingExpense = await FriendDb.getExpense(friend_expense_id);
    if (!existingExpense) throw new ErrorHandler(404, "Expense not found");

    // Verify that the expense belongs to the current conversation
    if (friendExist.conversation_id !== existingExpense.conversation_id) {
      throw new ErrorHandler(403, "You are not allowed to delete this expense");
    }

    const transaction = await sequelize.transaction();
    try {
      // Update the is_deleted field
      await FriendDb.updateExpense(
        { is_deleted: 2 },
        friend_expense_id,
        transaction,
      );

      // Delete the expense
      const { affectedRows } = await FriendDb.deleteExpense(
        friend_expense_id,
        transaction,
      );
      if (affectedRows === 0)
        throw new ErrorHandler(400, "Failed to delete expense");

      // Update the balance in the friends table
      await FriendDb.updateFriends(
        {
          balance_amount:
            existingExpense.payer_id === friendExist.friend1_id
              ? parseFloat(friendExist.balance_amount) -
                parseFloat(existingExpense.debtor_amount)
              : parseFloat(friendExist.balance_amount) +
                parseFloat(existingExpense.debtor_amount),
        },
        conversation_id,
        transaction,
      );
      // Commit the transaction
      await transaction.commit();
      return { message: "Expense deleted successfully" };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Service to fetch both expenses and messages together
   *
   * Fetches both expenses and messages for a conversation, sorted by creation time.
   * Supports pagination.
   *
   * @param {UUID} conversation_id - The ID of the conversation.
   * @param {number} [page=1] - The page number to retrieve (default: 1).
   * @param {number} [pageSize=20] - The number of items per page (default: 20).
   *
   * @returns {Promise<Array<Object>>} - Returns an array of expenses and messages.
   */
  static getBoth = async (conversation_id, page = 1, pageSize = 20) => {
    const totalMessages = await FriendDb.countMessages(conversation_id);
    const totalExpenses = await FriendDb.countExpenses(conversation_id);
    const totalItems = totalMessages + totalExpenses;

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Return an empty array if the offset exceeds total items
    if (offset >= totalItems) {
      return [];
    }

    const messages = await this.getMessages(conversation_id, 1, pageSize * 2);
    const expenses = await this.getExpenses(conversation_id, 1, pageSize * 2);

    // Combine and sort the results by creation time
    const messagesAndExpenses = [...messages, ...expenses];
    messagesAndExpenses.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    // Return the paginated results
    return messagesAndExpenses.slice(offset, offset + pageSize);
  };
}

/**
 * Helper function to format the raw friend data from the database into a client-friendly format.
 *
 * @param {UUID} userId - The ID of the user for whom the friend list is fetched.
 *
 * @returns {Function} - A function that takes a friend object and returns a formatted friend data object.
 */
const formatFriendData = (userId) => (friend) => {
  // Pick the one that's not null since depending on the logged in user one would always be null
  const matchedFriend = friend.friend1 || friend.friend2;
  return {
    conversation_id: friend.conversation_id,
    status: friend.friend1 ? "RECEIVER" : "SENDER", // Determine if user is RECEIVER or SENDER
    balance_amount:
      userId === friend.friend1_id
        ? friend.balance_amount // Positive balance for friend1
        : -friend.balance_amount, // Negative balance for friend2
    archival_status: friend.archival_status,
    block_status: friend.block_status,
    friend: {
      user_id: matchedFriend.user_id,
      first_name: matchedFriend.first_name,
      last_name: matchedFriend.last_name,
      email: matchedFriend.email,
      image_url: matchedFriend.image_url,
    },
  };
};

/**
 * Helper function that calculates the debtor amount based on the split type of the expense.
 *
 * @param {Object} expenseData - The data of the expense.
 * @param {Object|null} existingExpense - The existing expense data (if any).
 *
 * @returns {number} - The calculated debtor amount.
 */
const calculateDebtorAmount = (expenseData, existingExpense = null) => {
  const totalAmount =
    parseFloat(expenseData.total_amount) || // Use new total amount if availabe
    parseFloat(existingExpense.total_amount); // Otherwise, use the existing total amount
  expenseData.split_type = expenseData.split_type || existingExpense.split_type;

  // Handle different split types
  switch (expenseData.split_type) {
    case "EQUAL":
      return totalAmount / 2; // Split equally between participants
    case "UNEQUAL":
      // Validate that participant shares add up to total amount and debtor share matches
      if (
        !(
          parseFloat(expenseData.participant1_share) +
            parseFloat(expenseData.participant2_share) ===
            totalAmount &&
          (expenseData.debtor_share === expenseData.participant1_share ||
            expenseData.debtor_share === expenseData.participant2_share)
        )
      ) {
        throw new ErrorHandler(
          400,
          "The debtor share and payer share do not add up to the total amount.",
        );
      }

      return parseFloat(expenseData.debtor_share);
    case "PERCENTAGE":
      // Validate that percentages add up to 100 and debtor share matches
      if (
        !(
          parseFloat(expenseData.participant1_share) +
            parseFloat(expenseData.participant2_share) ===
            100 &&
          (expenseData.debtor_share === expenseData.participant1_share ||
            expenseData.debtor_share === expenseData.participant2_share)
        )
      ) {
        throw new ErrorHandler(
          400,
          "The debtor share and payer share do not add up to 100.",
        );
      }

      return (totalAmount * parseFloat(expenseData.debtor_share)) / 100;
    case "SETTLEMENT":
      return totalAmount; // The full amount is used for settlement
    default:
      throw new ErrorHandler(400, "Split type not recognized");
  }
};

// Helper function to calculate the new balance based on the payer
/**
 * Helper function that calculates the new balance between friends based on the expense and payer information.
 *
 * @param {number} currentBalance - The current balance between the friends.
 * @param {number} debtorAmount - The amount owed by the debtor.
 * @param {UUID} newPayerId - The ID of the new payer.
 * @param {Object} friendExist - The friend relationship data.
 * @param {string} type - The split type of the expense.
 * @param {Object|null} existingExpense - The existing expense data (if any).
 * @param {boolean} isUpdate - Whether the balance update is for an existing expense.
 *
 * @returns {number} - The updated balance.
 */
const calculateNewBalance = (
  currentBalance,
  debtorAmount,
  newPayerId,
  friendExist,
  type,
  existingExpense = null,
  isUpdate = false,
) => {
  if (!isUpdate) {
    // Handle the case for new entries
    if (type !== "SETTLEMENT") {
      // Adjust balance for non-settlement types
      return newPayerId === friendExist.friend1_id
        ? currentBalance + debtorAmount // Increment for friend1 as payer
        : currentBalance - debtorAmount; // Decrement for friend2 as payer
    } else {
      // Adjust balance for settlement types
      return currentBalance > 0
        ? currentBalance - debtorAmount // Reduce positive balance to approach 0
        : currentBalance + debtorAmount; // Reduce negative balance to approach 0
    }
  } else {
    // Handle updates to existing expenses
    // First, handle the swap if payer_id and debtor_id are interchanged
    if (
      newPayerId !== existingExpense.payer_id &&
      existingExpense.debtor_id === newPayerId
    ) {
      // Reverse the old impact of the existing expense
      currentBalance +=
        existingExpense.payer_id === friendExist.friend1_id
          ? -parseFloat(existingExpense.debtor_amount) // Substract if friend1 was payer
          : parseFloat(existingExpense.debtor_amount); // Add if friend2 was payer

      // Apply the new impact of the swapped payer and debtor
      currentBalance +=
        newPayerId === friendExist.friend1_id
          ? parseFloat(existingExpense.debtor_amount) // Add if friend1 is now payer
          : -parseFloat(existingExpense.debtor_amount); // Substract if friend2 is now payer
    }

    // Handle changes in other balance-affecting fields after the swap
    if (type !== "SETTLEMENT") {
      currentBalance +=
        newPayerId === friendExist.friend1_id
          ? debtorAmount - parseFloat(existingExpense.debtor_amount)
          : -(debtorAmount - parseFloat(existingExpense.debtor_amount));
    } else {
      currentBalance +=
        currentBalance > 0
          ? -(debtorAmount - parseFloat(existingExpense.debtor_amount)) // Reduce positive balance to approach 0
          : debtorAmount - parseFloat(existingExpense.debtor_amount); // Reduce negative balance to approach 0
    }

    return currentBalance;
  }
};

/**
 * Helper function that validates the settlement amount to ensure it does not exceed the current balance.
 *
 * @param {number} currentBalance - The current balance between the friends.
 * @param {number} debtorAmount - The amount being settled.
 */
const validateSettlementAmount = (currentBalance, debtorAmount) => {
  // Ensure the debtor amount does not exceed the current debt for negative balances
  if (currentBalance < 0 && debtorAmount > Math.abs(currentBalance)) {
    throw new ErrorHandler(
      400,
      "Settlement amount cannot exceed your current debt.",
    );
  }
  // Ensure the debtor amount does not exceed the current balance for positive balances
  else if (currentBalance > 0 && debtorAmount > currentBalance) {
    throw new ErrorHandler(
      400,
      "Settlement amount cannot exceed your current balance.",
    );
  }
};

export default FriendService;
