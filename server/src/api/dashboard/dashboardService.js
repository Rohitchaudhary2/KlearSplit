import UserDb from "../users/userDb.js";
import DashboardDb from "./dashboardDb.js";

function sortFriendsByAmount(obj, field) {
  // Convert the object into an array of key-value pairs
  let entries = Object.entries(obj);

  // Sort the array by the field amount
  entries.sort((a, b) => b[1][field] - a[1][field]); // Descending order

  let othersAmount = 0;

  for (let i = 4; i < entries.length; i++) {
    othersAmount += entries[i][1].amount;
  }

  entries = entries.slice(0, 4);

  entries.push(["others", { amount: othersAmount, friend: "others" }]);

  // Rebuilding the object with sorted entries
  const sortedObj = {};
  entries.forEach(([key, value]) => {
    sortedObj[key] = value;
  });

  return sortedObj;
}

class DashboardService {
  static async getAllExpenses(user_id) {
    const expenses = await DashboardDb.getAllExpenses(user_id);
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
          acc.monthlyExpense[expense.createdAt.getMonth()] += expenseAmount;
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

        acc.balanceAmounts[index] += debtAmount;

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

    result.topFriends = sortFriendsByAmount(result.topFriends, "amount");
    const topFourFriendsId = [];
    Object.entries(result.topFriends)
      .slice(0, 4)
      .map((value) => {
        topFourFriendsId.push(value[1].friend);
      });

    let topFourFriendsName = await UserDb.getUsersById(topFourFriendsId);

    topFourFriendsName = topFourFriendsName.map((user) => {
      const name = `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`;
      return name;
    });
    Object.keys(result.topFriends)
      .slice(0, 4)
      .forEach((key, index) => {
        result.topFriends[key].friend = topFourFriendsName[index];
      });

    return result;
  }
}

export default DashboardService;
