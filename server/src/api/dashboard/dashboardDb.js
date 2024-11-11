import { Op } from "sequelize";
import { FriendExpense } from "../../config/db.connection.js";

class DashboardDb {
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
