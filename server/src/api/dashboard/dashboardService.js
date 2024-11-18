import UserDb from "../users/userDb.js";
import DashboardDb from "./dashboardDb.js";

/**
 * Sorts friends by the specified field (amount) in descending order, and aggregates
 * any remaining friends into an "others" category if there are more than 4 friends.
 * @param {Object} topFriends - An object where each key represents a conversation ID,
 *                               and the value is an object containing `amount` and `friend` properties.
 * @param {string} field - The field by which to sort the friends.
 * @returns {Object} - A sorted object with the top friends based on the specified field, and "others" category.
 */
function sortFriendsByAmount(topFriends, field) {
  // Converting the object into an array of key-value pairs
  let entries = Object.entries(topFriends);

  // Sort the array by the field amount
  entries.sort((a, b) => b[1][field] - a[1][field]); // Descending order

  const extraEntries = entries.slice(4);
  const othersAmount = extraEntries.reduce((acc, val) => {
    acc += val[1].amount;
  }, 0);

  entries = entries.slice(0, 4);
  if (entries.length > 4)
    entries.push(["others", { amount: othersAmount, friend: "others" }]);

  // Rebuilding the object with sorted entries
  const sortedTopFriends = {};
  entries.forEach(([key, value]) => {
    sortedTopFriends[key] = value;
  });

  return sortedTopFriends;
}

class DashboardService {
  /**
   * Fetches all expenses data for a user and processes it into various statistics(expensesRange, balanceAmoounts(amount lent and amount borrowed),
   * top expense partners, and monthly expense amoount).
   * @param {string} user_id - The ID of the user whose expense data is being fetched.
   * @returns {Promise<Object>} - A structured object containing processed expenses data.
   */
  static async getAllExpensesData(user_id) {
    const expenses = await DashboardDb.getAllExpenses(user_id);

    // Reduce the expenses into a summary object with categorized information
    const result = expenses.reduce(
      (acc, expense) => {
        const amount = parseFloat(expense.total_amount);
        const debtAmount = parseFloat(expense.debtor_amount);
        const paidAmount = amount - debtAmount;

        const { expenseAmount, index } =
          expense.payer_id === user_id
            ? { expenseAmount: paidAmount, index: 0 }
            : { expenseAmount: debtAmount, index: 1 };

        if (expense.split_type !== "SETTLEMENT") {
          // Monthly Expense according to index to months.
          acc.monthlyExpense[expense.createdAt.getMonth()] += expenseAmount;
          // Expense count according to user's money involved in that expense.
          if (expenseAmount >= 1 && expenseAmount <= 1000) {
            acc.expensesRange[0]++;
          } else if (expenseAmount >= 1001 && expenseAmount <= 5000) {
            acc.expensesRange[1]++;
          } else if (expenseAmount >= 5001 && expenseAmount <= 10000) {
            acc.expensesRange[2]++;
          } else if (expenseAmount >= 10001 && expenseAmount <= 15000) {
            acc.expensesRange[3]++;
          } else if (expenseAmount > 15000) {
            acc.expensesRange[4]++;
          }
        }

        // Amount lent or borrowed
        acc.balanceAmounts[index] += debtAmount;

        // Top friends with highest cash flow
        acc.topFriends[expense.conversation_id]
          ? (acc.topFriends[expense.conversation_id].amount += debtAmount)
          : (acc.topFriends[expense.conversation_id] = {
              amount: debtAmount,
              friend:
                expense.payer_id === user_id
                  ? expense.debtor_id
                  : expense.payer_id,
            });

        return acc;
      },
      {
        expensesRange: [0, 0, 0, 0, 0],
        balanceAmounts: [0, 0],
        topFriends: {},
        monthlyExpense: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    );

    // Sort top friends by the amount of money involved (highest first)
    result.topFriends = sortFriendsByAmount(result.topFriends, "amount");

    // user IDs of top Partners in cash flow
    const topFourFriendsId = [];
    Object.entries(result.topFriends)
      .slice(0, 4)
      .map((value) => {
        topFourFriendsId.push(value[1].friend);
      });

    // Names of top partners in cash flow
    let topFourFriendsName = await UserDb.getUsersById(topFourFriendsId);
    topFourFriendsName = topFourFriendsName.map((user) => {
      const name = `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`;
      return name;
    });

    // Replacing IDs of top partners in cash flow with their names in response
    Object.keys(result.topFriends)
      .slice(0, 4)
      .forEach((key, index) => {
        result.topFriends[key].friend = topFourFriendsName[index];
      });

    return result;
  }
}

export default DashboardService;
