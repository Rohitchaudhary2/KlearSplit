import { Op } from "sequelize";
import {
  User,
  Friend,
  FriendMessage,
  FriendExpense
} from "../../config/db.connection.js";

class FriendDb {
  /**
   * Adds a new friend entry to the database.
   * @param {Object} friendData - The data for the friend to be created.
   * @returns {Promise<Object>} - The created friend entry.
   */
  static addFriend = async(friendData) => await Friend.create(friendData);

  /**
   * Checks if a friendship already exists, optionally including soft-deleted entries.
   * @param {Object} friendData - The data of the friends to check.
   * @param {boolean} [flag=true] - Whether to include soft-deleted records.
   * @returns {Promise<Object|null>} - The found friend entry or null if none exists.
   */
  static checkFriendExist = async(friendData, flag = true) => {
    return await Friend.scope("withDeletedAt").findOne({
      "where": {
        [ Op.or ]: [
          {
            "friend1_id": friendData.friend1_id,
            "friend2_id": friendData.friend2_id
          },
          {
            "friend1_id": friendData.friend2_id,
            "friend2_id": friendData.friend1_id
          }
        ]
      },
      "paranoid": flag
    });
  };

  /**
   * Restores a soft-deleted friend entry.
   * @param {Object} friend - The friend entry to be restored.
   * @returns {Promise<void>} - Resolves when the friend is restored.
   */
  static restoreFriend = async(friend) => await friend.restore();

  /**
   * Fetches all friends of a user, applying optional filters.
   * @param {UUID} userId - The ID of the user whose friends are to be fetched.
   * @param {Object} filters - Filters to apply (status, archival_status, block_status).
   * @returns {Promise<Array<Object>>} - The list of friends matching the criteria.
   */
  static getAllFriends = async(
    userId,
    { status, "archival_status": archivalStatus, "block_status": blockStatus }
  ) => {
    const friendQueryConditions = {
      [ Op.or ]: [ { "friend1_id": userId }, { "friend2_id": userId } ]
    };

    if (status) {
      friendQueryConditions.status = status;
    }
    if (archivalStatus) {
      Object.assign(friendQueryConditions, { "archival_status": archivalStatus });
    }
    if (blockStatus) {
      Object.assign(friendQueryConditions, { "block_status": blockStatus });
    }

    return await Friend.findAll({
      "where": friendQueryConditions,
      "include": [
        {
          "model": User,
          "as": "friend1",
          "attributes": [
            "user_id",
            "first_name",
            "last_name",
            "email",
            "image_url"
          ],
          "where": {
            "user_id": {
              [ Op.ne ]: userId
            }
          },
          "required": false
        },
        {
          "model": User,
          "as": "friend2",
          "attributes": [
            "user_id",
            "first_name",
            "last_name",
            "email",
            "image_url"
          ],
          "where": {
            "user_id": {
              [ Op.ne ]: userId
            }
          },
          "required": false
        }
      ]
    });
  };

  /**
   * Fetches a friend request by conversation ID.
   * @param {UUID} conversationId - The ID of the conversation.
   * @returns {Promise<Object|null>} - The friend request entry or null if not found.
   */
  static getFriend = async(conversationId) =>
    await Friend.findByPk(conversationId);

  static getFriendWithUsers = async(conversationId) =>
    await Friend.findOne({
      "where": { "conversation_id": conversationId },
      "include": [
        {
          "model": User,
          "as": "friend1", // Alias for friend1 relationship in Friend model
          "required": true
        },
        {
          "model": User,
          "as": "friend2", // Alias for friend2 relationship in Friend model
          "required": true
        }
      ]
    });

  static getFriendByUserIds = async(userId1, userId2) => {
    return await Friend.findOne({
      "where": {
        [ Op.or ]: [
          { "friend1_id": userId1, "friend2_id": userId2 },
          { "friend1_id": userId2, "friend2_id": userId1 }
        ]
      }
    });
  };

  /**
   * Updates a friend entry with new data.
   * @param {Object} updatedData - The data to update in the friend entry.
   * @param {UUID} conversationId - The ID of the conversation to be updated.
   * @param {Object} [transaction=null] - Optional transaction for the update.
   * @returns {Promise<Array>} - An array with the number of affected rows and the updated entries.
   */
  static updateFriends = async(
    updatedData,
    conversationId,
    transaction = null
  ) =>
    await Friend.update(updatedData, {
      "where": {
        "conversation_id": conversationId
      },
      transaction,
      "returning": true
    });

  /**
   * Withdraws a friend request by deleting the entry.
   * @param {Object} friend - The friend entry to be deleted.
   * @returns {Promise<boolean>} - True if the deletion was successful, false otherwise.
   */
  static withdrawFriendRequest = async(friend) => {
    const result = await friend.destroy();

    return result > 0;
  };

  /**
   * Adds a message to the friend messages table.
   * @param {Object} messageData - The data for the message to be added.
   * @returns {Promise<Object>} - The created message entry.
   */
  static addMessage = async(messageData) =>
    await FriendMessage.create(messageData);

  /**
   * Retrieves all messages for a given conversation, with support for pagination.
   * @param {UUID} conversationId - The ID of the conversation.
   * @param {number} [timestamp] - The timestamp of the last message.
   * @param {number} [pageSize=10] - The number of messages per page.
   * @returns {Promise<Array>} - A promise that resolves to an array of messages.
   */
  static getMessages = async(conversationId, timestamp, pageSize = 10) => {
    return await FriendMessage.findAll({
      "where": {
        "conversation_id": conversationId,
        "createdAt": {
          [ Op.lt ]: timestamp
        }
      },
      "order": [ [ "createdAt", "DESC" ] ],
      "limit": pageSize
    });
  };

  /**
   * Counts the total number of messages in a specific conversation.
   * @param {UUID} conversationId - The ID of the conversation.
   * @returns {Promise<number>} - A promise that resolves to the count of messages.
   */
  static countMessages = async(conversationId) =>
    await FriendMessage.count({
      "where": {
        "conversation_id": conversationId
      }
    });

  /**
   * Adds a new expense record to the database.
   * @param {Object} expenseData - The data for the new expense.
   * @param {Object} transaction - Optional transaction object for database consistency.
   * @returns {Promise<Object>} - A promise that resolves to the created expense.
   */
  static addExpense = async(expenseData, transaction) =>
    await FriendExpense.create(expenseData, { transaction });

  /**
   * Retrieves all or paginated expenses for a given conversation, including payer details.
   * @param {UUID} conversationId - The ID of the conversation.
   * @param {number} [timestamp] - The timestamp of the last expense.
   * @param {number} [pageSize=10] - The number of expenses per page.
   * @param {boolean} [fetchAll=false] - Whether to fetch all expenses or use pagination.
   * @returns {Promise<Array>} - A promise that resolves to an array of expenses.
   */
  static getExpenses = async(
    conversationId,
    timestamp,
    pageSize = 10,
    fetchAll = false
  ) => {
    const options = {
      "where": {
        "conversation_id": conversationId,
        "createdAt": {
          [ Op.lt ]: timestamp
        }
      },
      "include": [
        {
          "model": User,
          "as": "payer",
          "attributes": [ "first_name", "last_name" ]
        }
      ],
      "order": [ [ "createdAt", "DESC" ] ]
    };

    if (!fetchAll) {
      options.limit = pageSize;
    }

    return await FriendExpense.findAll(options);
  };

  /**
   * Counts the total number of expenses in a specific conversation.
   * @param {UUID} conversationId - The ID of the conversation.
   * @returns {Promise<number>} - A promise that resolves to the count of expenses.
   */
  static countExpenses = async(conversationId) =>
    await FriendExpense.count({
      "where": {
        "conversation_id": conversationId
      }
    });

  /**
   * Retrieves a single expense record by its unique ID.
   * @param {UUID} friendExpenseId - The ID of the expense to fetch.
   * @returns {Promise<Object|null>} - A promise that resolves to the expense or null if not found.
   */
  static getExpense = async(friendExpenseId) =>
    await FriendExpense.findByPk(friendExpenseId);

  /**
   * Updates an existing expense record and returns the updated record with payer details.
   * @param {Object} updatedExpenseData - The data to update the expense with.
   * @param {UUID} friendExpenseId - The ID of the expense to update.
   * @param {Object} [transaction=null] - Optional transaction object for database consistency.
   * @returns {Promise<Object>} - A promise that resolves to an object containing affected rows and the updated expense.
   */
  static updateExpense = async(
    updatedExpenseData,
    friendExpenseId,
    transaction = null
  ) => {
    const [ affectedRows, [ updatedExpense ] ] = await FriendExpense.update(
      updatedExpenseData,
      {
        "where": { "friend_expense_id": friendExpenseId },
        transaction,
        "returning": true
      }
    );

    // If rows were affected, fetch the updated expense with payer details
    if (affectedRows > 0) {
      // Fetch the updated record with the associated payer's name
      const detailedExpense = await FriendExpense.findOne({
        "where": { "friend_expense_id": friendExpenseId },
        "include": [
          {
            "model": User,
            "as": "payer",
            "attributes": [ "first_name", "last_name" ]
          }
        ],
        transaction
      });

      return { affectedRows, "updatedExpense": detailedExpense };
    }
    return { affectedRows, updatedExpense };
  };

  /**
   * Deletes an expense record by its unique ID.
   * @param {UUID} friendExpenseId - The ID of the expense to delete.
   * @param {Object} transaction - Optional transaction object for database consistency.
   * @returns {Promise<number>} - A promise that resolves to the number of affected rows.
   */
  static deleteExpense = async(friendExpenseId, transaction) =>
    await FriendExpense.destroy({
      "where": { "friend_expense_id": friendExpenseId },
      transaction
    });

  static bulkAddExpenses = async(expenses, transaction) => await FriendExpense.bulkCreate(expenses, { transaction });
}

export default FriendDb;
