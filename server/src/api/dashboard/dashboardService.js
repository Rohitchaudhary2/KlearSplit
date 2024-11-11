import DashboardDb from "./dashboardDb.js";

function sortFriendsByAmount(obj, field) {
  // Convert the object into an array of key-value pairs
  const entries = Object.entries(obj);

  // Sort the array by the field amount
  entries.sort((a, b) => b[1][field] - a[1][field]); // Descending order

  let othersAmount = 0;

  for (let i = 4; i < entries.length; i++) {
    othersAmount += entries[i][1].amount;
  }

  entries
    .slice(0, 4)
    .push(["others", { amount: othersAmount, friend_id: "others" }]);

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

        if (amount >= 1 && amount <= 1000) {
          acc.expensesRange[0]++;
        } else if (amount >= 1001 && amount <= 5000) {
          acc.expensesRange[1]++;
        } else if (amount >= 5001 && amount <= 10000) {
          acc.expensesRange[2]++;
        } else if (amount >= 10001 && amount <= 15000) {
          acc.expensesRange[3]++;
        } else if (amount > 15000) {
          acc.expensesRange[4]++;
        }

        const debtAmount = parseFloat(expense.debtor_amount);
        const index = expense.payer_id === user_id ? 0 : 1;
        acc.balanceAmounts[index] += debtAmount;

        acc.topFriends[expense.conversation_id]
          ? (acc.topFriends[expense.conversation_id].amount += amount)
          : (acc.topFriends[expense.conversation_id] = {
              amount: amount,
              friend_id:
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
      },
    );

    result.topFriends = sortFriendsByAmount(result.topFriends, "amount");

    return { ...result };
  }
}

export default DashboardService;
