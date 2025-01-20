import { Op } from "sequelize";
import { FriendExpense, Group, GroupExpense, GroupExpenseParticipant, GroupMember, GroupSettlement } from "../../config/db.connection.js";

class DashboardDb {
  /**
   * Fetches all expense data for a given user, where the user is either the payer or the debtor.
   * @param {string} user_id - The ID of the user whose expense data is being fetched.
   * @returns {Promise<Array>} - A promise that resolves to an array of expense records.
   */
  static async getFriendExpenses(userId, year = null) {
    const whereCondition = {};

    if (year) {
      whereCondition.createdAt = {
        [ Op.between ]: [
          new Date(`${year}-01-01`), // Start of the year
          new Date(`${year}-12-31 23:59:59`) // End of the year
        ]
      };
    }

    const result = await FriendExpense.findAll({
      "where": {
        [ Op.or ]: [ { "payer_id": userId }, { "debtor_id": userId } ],
        ...whereCondition
      }
    });

    return result;
  }

  static getMembershipIds = async(userId) => await GroupMember.findAll({
    "attributes": [ "group_membership_id", "group_id" ],
    "where": {
      "member_id": userId
    },
    "raw": true
  });

  static groupExpensesAsPayer = async(ids, year = null) => {
    const whereCondition = {};

    if (year) {
      whereCondition.createdAt = {
        [ Op.between ]: [
          new Date(`${year}-01-01`), // Start of the year
          new Date(`${year}-12-31 23:59:59`) // End of the year
        ]
      };
    }
    return await GroupExpense.findAll({
      "where": {
        "payer_id": {
          [ Op.in ]: ids
        },
        ...whereCondition
      },
      "include": [
        {
          "model": GroupExpenseParticipant,
          "required": true
        }
      ]
    });
  };

  static groupExpensesAsDebtor = async(ids, year = null) => {
    const whereCondition = {};

    if (year) {
      whereCondition.createdAt = {
        [ Op.between ]: [
          new Date(`${year}-01-01`), // Start of the year
          new Date(`${year}-12-31 23:59:59`) // End of the year
        ]
      };
    }

    return await GroupExpenseParticipant.findAll({
      "where": {
        "debtor_id": {
          [ Op.in ]: ids
        },
        ...whereCondition
      },
      "raw": true
    });
  };

  static getGroupSettlements = async(ids, year = null) => {
    const whereCondition = {};

    if (year) {
      whereCondition.createdAt = {
        [ Op.between ]: [
          new Date(`${year}-01-01`), // Start of the year
          new Date(`${year}-12-31 23:59:59`) // End of the year
        ]
      };
    }
    
    return await GroupSettlement.findAll({
      "where": {
        [ Op.or ]: [
          {
            "payer_id": {
              [ Op.in ]: ids
            }
          },
          {
            "debtor_id": {
              [ Op.in ]: ids
            }
          }
        ],
        ...whereCondition
      },
      "raw": true
    });
  };

  static getGroupsById = async(ids) => {
    const groups = await Group.findAll({
      "attributes": [ "group_name", "group_id" ],
      "where": {
        "group_id": ids
      },
      "raw": true
    });
    
    return groups.sort(
      (a, b) => ids.indexOf(a.group_id) - ids.indexOf(b.group_id)
    );
  };
}

export default DashboardDb;
