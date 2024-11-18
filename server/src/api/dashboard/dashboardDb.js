import { Op } from "sequelize";
import { FriendExpense } from "../../config/db.connection.js";

class DashboardDb {
  /**
   * Fetches all expense data for a given user, where the user is either the payer or the debtor.
   * @param {string} user_id - The ID of the user whose expense data is being fetched.
   * @returns {Promise<Array>} - A promise that resolves to an array of expense records.
   */
  static async getAllExpenses(user_id) {
    const result = await FriendExpense.findAll({
      where: {
        [Op.or]: [{ payer_id: user_id }, { debtor_id: user_id }],
      },
    });
    return result;
  }
}

export default DashboardDb;
