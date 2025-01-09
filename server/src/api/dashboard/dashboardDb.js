import { Op, Sequelize } from "sequelize";
import { FriendExpense, GroupExpense, GroupExpenseParticipant, GroupMember, GroupSettlement } from "../../config/db.connection.js";

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
    "attributes": [ "group_membership_id" ],
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
  
  static getGroupExpenses = async(userId) => {
    return await GroupExpense.findAll({
      "include": [
        {
          "model": GroupExpenseParticipant,
          "required": true, // Ensures that at least one participant is included
          "where": {
            "group_expense_id": Sequelize.col("group_expenses.group_expense_id") // Ensure we filter by group_expense_id
          }
        },
        {
          "model": GroupMember,
          "required": true, // Ensures a matching member record is required
          "where": {
            "member_id": userId,
            [ Op.or ]: [
              // Check if group_membership_id matches payer_id from GroupExpense
              {
                "group_membership_id": {
                  [ Op.eq ]: Sequelize.col("group_expenses.payer_id")
                }
              },
              // Check if any debtor_id in GroupExpenseParticipants matches group_membership_id
              {
                "$group_expense_participants.debtor_id$": {
                  [ Op.eq ]: Sequelize.col("group_members.group_membership_id")
                }
              }
            ]
          }
        }
      ]
    });
  };
}

export default DashboardDb;
