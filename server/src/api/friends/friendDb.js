import { Op } from "sequelize";
import {
  User,
  Friend,
  FriendMessage,
  FriendExpense,
} from "../../config/db.connection.js";

class FriendDb {
  /**
   * Adds a new friend entry to the database.
   * @param {Object} friendData - The data for the friend to be created.
   * @returns {Promise<Object>} - The created friend entry.
   */
  static addFriend = async (friendData) => await Friend.create(friendData);

  /**
   * Checks if a friendship already exists, optionally including soft-deleted entries.
   * @param {Object} friendData - The data of the friends to check.
   * @param {boolean} [flag=true] - Whether to include soft-deleted records.
   * @returns {Promise<Object|null>} - The found friend entry or null if none exists.
   */
  static checkFriendExist = async (friendData, flag = true) =>
    await Friend.scope("withDeletedAt").findOne({
      where: {
        [Op.or]: [
          {
            friend1_id: friendData.friend1_id,
            friend2_id: friendData.friend2_id,
          },
          {
            friend1_id: friendData.friend2_id,
            friend2_id: friendData.friend1_id,
          },
        ],
      },
      paranoid: flag,
    });

  /**
   * Restores a soft-deleted friend entry.
   * @param {Object} friend - The friend entry to be restored.
   * @returns {Promise<void>} - Resolves when the friend is restored.
   */
  static restoreFriend = async (friend) => await friend.restore();

  /**
   * Fetches all friends of a user, applying optional filters.
   * @param {UUID} userId - The ID of the user whose friends are to be fetched.
   * @param {Object} filters - Filters to apply (status, archival_status, block_status).
   * @returns {Promise<Array<Object>>} - The list of friends matching the criteria.
   */
  static getAllFriends = async (
    userId,
    { status, archival_status, block_status },
  ) => {
    const friendQueryConditions = {
      [Op.or]: [{ friend1_id: userId }, { friend2_id: userId }],
    };

    if (status) friendQueryConditions.status = status;
    if (archival_status)
      friendQueryConditions.archival_status = archival_status;
    if (block_status) friendQueryConditions.block_status = block_status;

    return await Friend.findAll({
      where: friendQueryConditions,
      include: [
        {
          model: User,
          as: "friend1",
          attributes: [
            "user_id",
            "first_name",
            "last_name",
            "email",
            "image_url",
          ],
          where: {
            user_id: {
              [Op.ne]: userId,
            },
          },
          required: false,
        },
        {
          model: User,
          as: "friend2",
          attributes: [
            "user_id",
            "first_name",
            "last_name",
            "email",
            "image_url",
          ],
          where: {
            user_id: {
              [Op.ne]: userId,
            },
          },
          required: false,
        },
      ],
    });
  };

  /**
   * Fetches a friend request by conversation ID.
   * @param {UUID} conversation_id - The ID of the conversation.
   * @returns {Promise<Object|null>} - The friend request entry or null if not found.
   */
  static getFriend = async (conversation_id) =>
    await Friend.findByPk(conversation_id);

  /**
   * Updates a friend entry with new data.
   * @param {Object} updatedData - The data to update in the friend entry.
   * @param {UUID} conversation_id - The ID of the conversation to be updated.
   * @param {Object} [transaction=null] - Optional transaction for the update.
   * @returns {Promise<Array>} - An array with the number of affected rows and the updated entries.
   */
  static updateFriends = async (
    updatedData,
    conversation_id,
    transaction = null,
  ) =>
    await Friend.update(updatedData, {
      where: {
        conversation_id,
      },
      transaction,
      returning: true,
    });

  /**
   * Withdraws a friend request by deleting the entry.
   * @param {Object} friend - The friend entry to be deleted.
   * @returns {Promise<boolean>} - True if the deletion was successful, false otherwise.
   */
  static withdrawFriendRequest = async (friend) => {
    const result = await friend.destroy();
    return result > 0;
  };

  /**
   * Adds a message to the friend messages table.
   * @param {Object} messageData - The data for the message to be added.
   * @returns {Promise<Object>} - The created message entry.
   */
  static addMessage = async (messageData) =>
    await FriendMessage.create(messageData);

  /**
   * Retrieves all messages for a given conversation, with support for pagination.
   * @param {UUID} conversation_id - The ID of the conversation.
   * @param {number} [page=1] - The page number for pagination.
   * @param {number} [pageSize=10] - The number of messages per page.
   * @returns {Promise<Array>} - A promise that resolves to an array of messages.
   */
  static getMessages = async (conversation_id, page = 1, pageSize = 10) => {
    const offset = (page - 1) * pageSize;

    return await FriendMessage.findAll({
      where: {
        conversation_id,
      },
      order: [["createdAt", "DESC"]],
      limit: pageSize,
      offset,
    });
  };

  /**
   * Counts the total number of messages in a specific conversation.
   * @param {UUID} conversation_id - The ID of the conversation.
   * @returns {Promise<number>} - A promise that resolves to the count of messages.
   */
  static countMessages = async (conversation_id) =>
    await FriendMessage.count({
      where: {
        conversation_id: conversation_id,
      },
    });

  /**
   * Adds a new expense record to the database.
   * @param {Object} expenseData - The data for the new expense.
   * @param {Object} transaction - Optional transaction object for database consistency.
   * @returns {Promise<Object>} - A promise that resolves to the created expense.
   */
  static addExpense = async (expenseData, transaction) =>
    await FriendExpense.create(expenseData, { transaction });

  /**
   * Retrieves all or paginated expenses for a given conversation, including payer details.
   * @param {UUID} conversation_id - The ID of the conversation.
   * @param {number} [page=1] - The page number for pagination.
   * @param {number} [pageSize=10] - The number of expenses per page.
   * @param {boolean} [fetchAll=false] - Whether to fetch all expenses or use pagination.
   * @returns {Promise<Array>} - A promise that resolves to an array of expenses.
   */
  static getExpenses = async (
    conversation_id,
    page = 1,
    pageSize = 10,
    fetchAll = false,
  ) => {
    const offset = (page - 1) * pageSize;
    const options = {
      where: {
        conversation_id,
      },
      include: [
        {
          model: User,
          as: "payer",
          attributes: ["first_name", "last_name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    };

    if (!fetchAll) {
      options.limit = pageSize;
      options.offset = offset;
    }

    return await FriendExpense.findAll(options);
  };

  /**
   * Counts the total number of expenses in a specific conversation.
   * @param {UUID} conversation_id - The ID of the conversation.
   * @returns {Promise<number>} - A promise that resolves to the count of expenses.
   */
  static countExpenses = async (conversation_id) =>
    await FriendExpense.count({
      where: {
        conversation_id: conversation_id,
      },
    });

  /**
   * Retrieves a single expense record by its unique ID.
   * @param {UUID} friend_expense_id - The ID of the expense to fetch.
   * @returns {Promise<Object|null>} - A promise that resolves to the expense or null if not found.
   */
  static getExpense = async (friend_expense_id) =>
    await FriendExpense.findByPk(friend_expense_id);

  /**
   * Updates an existing expense record and returns the updated record with payer details.
   * @param {Object} updatedExpenseData - The data to update the expense with.
   * @param {UUID} friend_expense_id - The ID of the expense to update.
   * @param {Object} [transaction=null] - Optional transaction object for database consistency.
   * @returns {Promise<Object>} - A promise that resolves to an object containing affected rows and the updated expense.
   */
  static updateExpense = async (
    updatedExpenseData,
    friend_expense_id,
    transaction = null,
  ) => {
    const [affectedRows, [updatedExpense]] = await FriendExpense.update(
      updatedExpenseData,
      {
        where: { friend_expense_id },
        transaction,
        returning: true,
      },
    );

    // If rows were affected, fetch the updated expense with payer details
    if (affectedRows > 0) {
      // Fetch the updated record with the associated payer's name
      const detailedExpense = await FriendExpense.findOne({
        where: { friend_expense_id },
        include: [
          {
            model: User,
            as: "payer",
            attributes: ["first_name", "last_name"],
          },
        ],
        transaction,
      });
      return { affectedRows, updatedExpense: detailedExpense };
    }
    return { affectedRows, updatedExpense };
  };

  /**
   * Deletes an expense record by its unique ID.
   * @param {UUID} friend_expense_id - The ID of the expense to delete.
   * @param {Object} transaction - Optional transaction object for database consistency.
   * @returns {Promise<number>} - A promise that resolves to the number of affected rows.
   */
  static deleteExpense = async (friend_expense_id, transaction) =>
    await FriendExpense.destroy({
      where: { friend_expense_id },
      transaction,
    });
}

export default FriendDb;
