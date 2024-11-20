import { ErrorHandler } from "../middlewares/errorHandler.js";

/**
 * Helper function to format the raw friend data from the database into a client-friendly format.
 *
 * @param {UUID} userId - The ID of the user for whom the friend list is fetched.
 *
 * @returns {Function} - A function that takes a friend object and returns a formatted friend data object.
 */
const formatFriendData = (userId) => (friend) => {
  // Pick the one that's not null since depending on the logged in user one would always be null
  const matchedFriend = friend.friend1 || friend.friend2;
  return {
    conversation_id: friend.conversation_id,
    status: friend.friend1 ? "RECEIVER" : "SENDER", // Determine if user is RECEIVER or SENDER
    balance_amount:
      userId === friend.friend1_id
        ? friend.balance_amount // Positive balance for friend1
        : -friend.balance_amount, // Negative balance for friend2
    archival_status: friend.archival_status,
    block_status: friend.block_status,
    friend: {
      user_id: matchedFriend.user_id,
      first_name: matchedFriend.first_name,
      last_name: matchedFriend.last_name,
      email: matchedFriend.email,
      image_url: matchedFriend.image_url,
    },
  };
};

/**
 * Determines the new archival or block status of a friendship based on the existing status and given tags.
 *
 * @param {string} friendTag1 - The first possible friendship tag (e.g., "FRIEND1").
 * @param {string} friendTag2 - The second possible friendship tag (e.g., "FRIEND2").
 * @param {object} friendExist - An object representing the current friendship, containing the `statusField`.
 *
 * @returns {string} The updated archive/block status.
 *
 * The logic for determining the new status is as follows:
 * - If the current status is "NONE", set it to `friendTag1`.
 * - If the current status matches `friendTag2`, update it to "BOTH" (indicating mutual archive/block).
 * - If the current status matches `friendTag1`, reset it to "NONE".
 * - If the current status is "BOTH", switch it to `friendTag2`.
 * - If the status is invalid, throw an error.
 */
const getNewStatus = (friendTag1, friendTag2, status) => {
  switch (status) {
    case "NONE":
      return friendTag1;
    case friendTag2:
      return "BOTH";
    case friendTag1:
      return "NONE";
    case "BOTH":
      return friendTag2;
    default:
      throw new ErrorHandler(400, "Invalid status field");
  }
};

/**
 * Helper function that calculates the debtor amount based on the split type of the expense.
 *
 * @param {Object} expenseData - The data of the expense.
 * @param {Object|null} existingExpense - The existing expense data (if any).
 *
 * @returns {number} - The calculated debtor amount.
 */
const calculateDebtorAmount = (expenseData, existingExpense = null) => {
  const totalAmount =
    parseFloat(expenseData.total_amount) || // Use new total amount if availabe
    parseFloat(existingExpense.total_amount); // Otherwise, use the existing total amount
  expenseData.split_type = expenseData.split_type || existingExpense.split_type;

  // Handle different split types
  switch (expenseData.split_type) {
    case "EQUAL":
      return totalAmount / 2; // Split equally between participants
    case "UNEQUAL":
      // Validate that participant shares add up to total amount and debtor share matches
      if (
        !(
          parseFloat(expenseData.participant1_share) +
            parseFloat(expenseData.participant2_share) ===
            totalAmount &&
          (expenseData.debtor_share === expenseData.participant1_share ||
            expenseData.participant2_share)
        )
      ) {
        throw new ErrorHandler(
          400,
          "The debtor share and payer share do not add up to the total amount.",
        );
      }

      return parseFloat(expenseData.debtor_share);
    case "PERCENTAGE":
      // Validate that percentages add up to 100 and debtor share matches
      if (
        !(
          parseFloat(expenseData.participant1_share) +
            parseFloat(expenseData.participant2_share) ===
            100 &&
          (expenseData.debtor_share === expenseData.participant1_share ||
            expenseData.participant2_share)
        )
      ) {
        throw new ErrorHandler(
          400,
          "The debtor share and payer share do not add up to 100.",
        );
      }

      return (totalAmount * parseFloat(expenseData.debtor_share)) / 100;
    case "SETTLEMENT":
      return totalAmount; // The full amount is used for settlement
    default:
      throw new ErrorHandler(400, "Split type not recognized");
  }
};

// Helper function to calculate the new balance based on the payer
/**
 * Helper function that calculates the new balance between friends based on the expense and payer information.
 *
 * @param {number} currentBalance - The current balance between the friends.
 * @param {number} debtorAmount - The amount owed by the debtor.
 * @param {UUID} newPayerId - The ID of the new payer.
 * @param {Object} friendExist - The friend relationship data.
 * @param {string} type - The split type of the expense.
 * @param {Object|null} existingExpense - The existing expense data (if any).
 * @param {boolean} isUpdate - Whether the balance update is for an existing expense.
 *
 * @returns {number} - The updated balance.
 */
const calculateNewBalance = (
  currentBalance,
  debtorAmount,
  newPayerId,
  friendExist,
  type,
  existingExpense = null,
  isUpdate = false,
) => {
  if (!isUpdate) {
    // Handle the case for new entries
    if (type !== "SETTLEMENT") {
      // Adjust balance for non-settlement types
      return newPayerId === friendExist.friend1_id
        ? currentBalance + debtorAmount // Increment for friend1 as payer
        : currentBalance - debtorAmount; // Decrement for friend2 as payer
    } else {
      // Adjust balance for settlement types
      return currentBalance > 0
        ? currentBalance - debtorAmount // Reduce positive balance to approach 0
        : currentBalance + debtorAmount; // Reduce negative balance to approach 0
    }
  } else {
    // Handle updates to existing expenses
    // First, handle the swap if payer_id and debtor_id are interchanged
    if (
      newPayerId !== existingExpense.payer_id &&
      existingExpense.debtor_id === newPayerId
    ) {
      // Reverse the old impact of the existing expense
      currentBalance +=
        existingExpense.payer_id === friendExist.friend1_id
          ? -parseFloat(existingExpense.debtor_amount) // Substract if friend1 was payer
          : parseFloat(existingExpense.debtor_amount); // Add if friend2 was payer

      // Apply the new impact of the swapped payer and debtor
      currentBalance +=
        newPayerId === friendExist.friend1_id
          ? parseFloat(existingExpense.debtor_amount) // Add if friend1 is now payer
          : -parseFloat(existingExpense.debtor_amount); // Substract if friend2 is now payer
    }

    // Handle changes in other balance-affecting fields after the swap
    if (type !== "SETTLEMENT") {
      currentBalance +=
        newPayerId === friendExist.friend1_id
          ? debtorAmount - parseFloat(existingExpense.debtor_amount)
          : -(debtorAmount - parseFloat(existingExpense.debtor_amount));
    } else {
      currentBalance +=
        currentBalance > 0
          ? -(debtorAmount - parseFloat(existingExpense.debtor_amount)) // Reduce positive balance to approach 0
          : debtorAmount - parseFloat(existingExpense.debtor_amount); // Reduce negative balance to approach 0
    }

    return currentBalance;
  }
};

/**
 * Helper function that validates the settlement amount to ensure it does not exceed the current balance.
 *
 * @param {number} currentBalance - The current balance between the friends.
 * @param {number} debtorAmount - The amount being settled.
 */
const validateSettlementAmount = (currentBalance, debtorAmount) => {
  // Ensure the debtor amount does not exceed the current debt for negative balances
  if (currentBalance < 0 && debtorAmount > Math.abs(currentBalance)) {
    throw new ErrorHandler(
      400,
      "Settlement amount cannot exceed your current debt.",
    );
  }
  // Ensure the debtor amount does not exceed the current balance for positive balances
  else if (currentBalance > 0 && debtorAmount > currentBalance) {
    throw new ErrorHandler(
      400,
      "Settlement amount cannot exceed your current balance.",
    );
  }
};

export {
    formatFriendData,
    getNewStatus,
    calculateDebtorAmount,
    calculateNewBalance,
    validateSettlementAmount,
}
