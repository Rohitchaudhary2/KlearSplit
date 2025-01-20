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
// eslint-disable-next-line func-style
function sortFriendsByAmount(topFriends, field, isGroup = false) {
  // Converting the object into an array of key-value pairs
  let entries = Object.entries(topFriends);

  // Sort the array by the field amount
  entries.sort((a, b) => b[ 1 ][ field ] - a[ 1 ][ field ]); // Descending order

  const extraEntries = entries.slice(4);
  
  if (extraEntries.length > 0) {
    entries = entries.slice(0, 4);
    const othersAmount = extraEntries.reduce((acc, val) => {
      return acc + val[ 1 ].amount;
    }, 0);

    const fieldName = isGroup ? "group" : "friend";

    entries.push([ "others", { "amount": othersAmount, [ fieldName ]: "others" } ]);
  }
    
  // Rebuilding the object with sorted entries
  const sortedTopFriends = {};

  entries.forEach(([ key, value ]) => {
    sortedTopFriends[ key ] = value;
  });

  return sortedTopFriends;
}

class DashboardService {
  static getExpensesCount = async(userId) => {
    const expensesCount = [ 0, 0, 0, 0, 0 ];
    const ranges = [ 1000, 5000, 10000, 15000 ]; // Expense thresholds
    const friendsExpenses = await DashboardDb.getFriendExpenses(userId);
    
    friendsExpenses.forEach((expense) => {
      if (expense.split_type !== "SETTLEMENT") {
        const amount = parseFloat(expense.total_amount);
        const debtAmount = parseFloat(expense.debtor_amount);
        const paidAmount = amount - debtAmount;
        const expenseAmount = expense.payer_id === userId ? paidAmount : debtAmount;
        const rangeIndex = expenseAmount > ranges[ ranges.length - 1 ] ? ranges.length : ranges.findIndex((range) => expenseAmount <= range);

        expensesCount[ rangeIndex ]++;
      }
    });

    const data = await DashboardDb.getMembershipIds(userId);

    const userMembershipIds = data.map((member) => member.group_membership_id);

    const expenseAmountAsPayer = await DashboardDb.groupExpensesAsPayer(userMembershipIds);

    expenseAmountAsPayer.forEach((expense) => {
      const debtAmount = expense.group_expense_participants.reduce((amount, debtor) => amount + parseFloat(debtor.debtor_amount), 0);
      const expenseAmount = parseFloat(expense.total_amount) - debtAmount;
      const rangeIndex = expenseAmount > ranges[ ranges.length - 1 ] ? ranges.length : ranges.findIndex((range) => expenseAmount <= range);

      expensesCount[ rangeIndex ]++;
    });

    const expenseAmountAsDebtor = await DashboardDb.groupExpensesAsDebtor(userMembershipIds);

    expenseAmountAsDebtor.forEach((debtor) => {
      const expenseAmount = parseFloat(debtor.debtor_amount);
      const rangeIndex = expenseAmount > ranges[ ranges.length - 1 ] ? ranges.length : ranges.findIndex((range) => expenseAmount <= range);

      expensesCount[ rangeIndex ]++;
    });

    return expensesCount;
  };

  static getBalance = async(userId) => {
    const balanceAmounts = [ 0, 0 ];
    const friendsExpenses = await DashboardDb.getFriendExpenses(userId);
    
    friendsExpenses.forEach((expense) => {
      const index = expense.payer_id === userId ? 0 : 1;

      balanceAmounts[ index ] += parseFloat(expense.debtor_amount);
    });

    const data = await DashboardDb.getMembershipIds(userId);

    const userMembershipIds = data.map((member) => member.group_membership_id);

    const expenseAmountAsPayer = await DashboardDb.groupExpensesAsPayer(userMembershipIds);

    expenseAmountAsPayer.forEach((expense) => {
      const debtAmount = expense.group_expense_participants.reduce((amount, debtor) => amount + parseFloat(debtor.debtor_amount), 0);

      balanceAmounts[ 0 ] += debtAmount;
    });
    
    const expenseAmountAsDebtor = await DashboardDb.groupExpensesAsDebtor(userMembershipIds);

    expenseAmountAsDebtor.forEach((debtor) => {
      balanceAmounts[ 1 ] += parseFloat(debtor.debtor_amount);
    });

    const groupSettlements = await DashboardDb.getGroupSettlements(userMembershipIds);

    groupSettlements.forEach((settlement) => {
      const index = userMembershipIds.includes(settlement.payer_id) ? 0 : 1;

      balanceAmounts[ index ] += parseFloat(settlement.settlement_amount);
    });

    return balanceAmounts;
  };

  static topCashFlowFriends = async(userId) => {
    let topFriends = {};
    const friendsExpenses = await DashboardDb.getFriendExpenses(userId);
    
    friendsExpenses.forEach((expense) => {
      const debtAmount = parseFloat(expense.debtor_amount);

      // Top friends with highest cash flow
      topFriends[ expense.conversation_id ] = topFriends[ expense.conversation_id ] ?? {
        "amount": 0,
        "friend": expense.payer_id === userId ? expense.debtor_id : expense.payer_id
      };
      
      topFriends[ expense.conversation_id ].amount += debtAmount;
    });

    topFriends = sortFriendsByAmount(topFriends, "amount");

    // user IDs of top Partners in cash flow
    const topFourFriendsId = [];

    Object.entries(topFriends)
      .slice(0, 4)
      .map((value) => {
        topFourFriendsId.push(value[ 1 ].friend);
      });

    // Names of top partners in cash flow
    let topFourFriendsName = await UserDb.getUsersById(topFourFriendsId);

    topFourFriendsName = topFourFriendsName.map((user) => {
      const name = `${user.first_name} ${ user.last_name ?? ""}`.trim();

      return name;
    });

    // Replacing IDs of top partners in cash flow with their names in response
    Object.keys(topFriends)
      .slice(0, 4)
      .forEach((key, index) => {
        topFriends[ key ].friend = topFourFriendsName[ index ];
      });
    
    return topFriends;
  };

  static topCashFlowGroups = async(userId) => {
    const topCashFlowGroups = {};
    const userMemberships = await DashboardDb.getMembershipIds(userId);

    const userMembershipIds = userMemberships.map((member) => member.group_membership_id);

    const expenseAmountAsPayer = await DashboardDb.groupExpensesAsPayer(userMembershipIds);

    expenseAmountAsPayer.forEach((expense) => {
      const debtAmount = expense.group_expense_participants.reduce((amount, debtor) => amount + parseFloat(debtor.debtor_amount), 0);

      topCashFlowGroups[ expense.payer_id ] = topCashFlowGroups[ expense.payer_id ] ?? {
        "amount": 0,
        "group": expense.group_id
      };
      
      topCashFlowGroups[ expense.payer_id ].amount += debtAmount;
    });
    
    const expenseAmountAsDebtor = await DashboardDb.groupExpensesAsDebtor(userMembershipIds);

    expenseAmountAsDebtor.forEach((debtor) => {
      const debtAmount = parseFloat(debtor.debtor_amount);
      const groupId = userMemberships.find((member) => member.group_membership_id === debtor.debtor_id).group_id;

      topCashFlowGroups[ debtor.debtor_id ] = topCashFlowGroups[ debtor.debtor_id ] ?? {
        "amount": 0,
        "group": groupId
      };

      topCashFlowGroups[ debtor.debtor_id ].amount += debtAmount;
    });

    const groupSettlements = await DashboardDb.getGroupSettlements(userMembershipIds);

    groupSettlements.forEach((settlement) => {
      const userMemberShipId = userMembershipIds.includes(settlement.payer_id) ? settlement.payer_id : settlement.debtor_id ;

      const settlementAmount = parseFloat(settlement.settlement_amount);

      topCashFlowGroups[ userMemberShipId ] = topCashFlowGroups[ userMemberShipId ] ?? {
        "amount": 0,
        "group": settlement.group_id
      };

      topCashFlowGroups[ userMemberShipId ].amount += settlementAmount;
    });

    const topGroups = sortFriendsByAmount(topCashFlowGroups, "amount", true);
    
    const topFourGroupsIds = Object.entries(topGroups).slice(0, 4).map((value) => value[ 1 ].group);

    const topFourGroupsName = await DashboardDb.getGroupsById(topFourGroupsIds);

    Object.keys(topGroups)
      .slice(0, 4)
      .forEach((key, index) => {
        topGroups[ key ].group = topFourGroupsName[ index ].group_name;
      });
    
    return topGroups;
  };

  static getMonthlyExpenses = async(userId, year) => {
    const monthlyExpenses = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    const friendsExpenses = await DashboardDb.getFriendExpenses(userId, year);
    
    friendsExpenses.forEach((expense) => {
      const amount = parseFloat(expense.total_amount);
      const debtAmount = parseFloat(expense.debtor_amount);
      const paidAmount = amount - debtAmount;
      const expenseAmount = expense.payer_id === userId ? paidAmount : debtAmount;

      monthlyExpenses[ expense.createdAt.getMonth() ] += expenseAmount;
    });

    const data = await DashboardDb.getMembershipIds(userId);

    const userMembershipIds = data.map((member) => member.group_membership_id);

    const expenseAmountAsPayer = await DashboardDb.groupExpensesAsPayer(userMembershipIds, year);

    expenseAmountAsPayer.forEach((expense) => {
      const debtAmount = expense.group_expense_participants.reduce((amount, debtor) => amount + parseFloat(debtor.debtor_amount), 0);
      const expenseAmount = parseFloat(expense.total_amount) - debtAmount;

      monthlyExpenses[ expense.createdAt.getMonth() ] += expenseAmount;
    });
    
    const expenseAmountAsDebtor = await DashboardDb.groupExpensesAsDebtor(userMembershipIds, year);

    expenseAmountAsDebtor.forEach((debtor) => {
      monthlyExpenses[ debtor.createdAt.getMonth() ] += parseFloat(debtor.debtor_amount);
    });

    return monthlyExpenses;
  };
}

export default DashboardService;
