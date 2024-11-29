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
    "conversation_id": friend.conversation_id,
    "status": friend.friend1 ? "RECEIVER" : "SENDER", // Determine if user is RECEIVER or SENDER
    "balance_amount":
      userId === friend.friend1_id ? friend.balance_amount : -friend.balance_amount,
    "archival_status": friend.archival_status,
    "block_status": friend.block_status,
    "friend": {
      "user_id": matchedFriend.user_id,
      "first_name": matchedFriend.first_name,
      "last_name": matchedFriend.last_name,
      "email": matchedFriend.email,
      "image_url": matchedFriend.image_url
    }
  };
};

/**
 * Determines the new archival or block status of a friendship based on the existing status and given tags.
 *
 * @param {string} friendTag1 - The first possible friendship tag (e.g., "FRIEND1").
 * @param {string} friendTag2 - The second possible friendship tag (e.g., "FRIEND2").
 * @param {string} status - A string representing the current archive or block status.
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
  const totalAmount = parseFloat(expenseData.total_amount) || parseFloat(existingExpense.total_amount);

  Object.assign(expenseData, { "split_type": expenseData.split_type || existingExpense.split_type });

  // Handle different split types
  switch (expenseData.split_type) {
    case "EQUAL":
      return totalAmount / 2; // Split equally between participants
    case "UNEQUAL":
      // Validate that participant shares add up to total amount and debtor share matches
      if (
        !(
          parseFloat(expenseData.participant1_share) + parseFloat(expenseData.participant2_share) === totalAmount && (expenseData.debtor_share === expenseData.participant1_share || expenseData.participant2_share)
        )
      ) {
        throw new ErrorHandler(
          400,
          "The debtor share and payer share do not add up to the total amount."
        );
      }

      return parseFloat(expenseData.debtor_share);
    case "PERCENTAGE":
      // Validate that percentages add up to 100 and debtor share matches
      if (
        !(
          parseFloat(expenseData.participant1_share) + parseFloat(expenseData.participant2_share) === 100 && (expenseData.debtor_share === expenseData.participant1_share || expenseData.participant2_share)
        )
      ) {
        throw new ErrorHandler(
          400,
          "The debtor share and payer share do not add up to 100."
        );
      }

      return (totalAmount * parseFloat(expenseData.debtor_share)) / 100;
    case "SETTLEMENT":
      return totalAmount; // The full amount is used for settlement
    default:
      throw new ErrorHandler(400, "Split type not recognized");
  }
};

/**
 * Handles balance calculation for new expense entries.
 *
 * @param {number} currentBalance - The current balance between the two friends.
 * @param {number} debtorAmount - The amount owed by the debtor.
 * @param {string} newPayerId - UUID of the payer for the new expense.
 * @param {Object} friend - The existing friend relationship object.
 * @param {string} type - Type of the expense, e.g., "SETTLEMENT" or other types.
 * @returns {number} - The updated balance after adding the new expense.
 */
const calculateForNewEntry = (currentBalance, debtorAmount, newPayerId, friend, type) => {
  if (type !== "SETTLEMENT") {
    return newPayerId === friend.friend1_id ? currentBalance + debtorAmount : currentBalance - debtorAmount;
  }
  return currentBalance > 0 ? currentBalance - debtorAmount : currentBalance + debtorAmount;
};

/**
 * Reverses the impact of an existing expense on the balance.
 *
 * @param {number} currentBalance - The current balance between the two friends.
 * @param {Object} existingExpense - The existing expense object.
 * @param {Object} friend - The existing friend relationship object.
 * @returns {number} - The updated balance after reversing the expense impact.
 */
const reverseOldImpact = (currentBalance, existingExpense, friend) => {
  // The following checks if the payer id in the existing expense is the same as that of friend 1 and if so,
  // it substract the existing debtor amount to reverse the previous change,
  // otherwise, it adds the existing debtor amount to reverse the previous change.
  return existingExpense.payer_id === friend.friend1_id ? currentBalance - parseFloat(existingExpense.debtor_amount) : currentBalance + parseFloat(existingExpense.debtor_amount);
};

/**
 * Applies the impact of a swapped payer and debtor for an updated expense.
 *
 * @param {number} currentBalance - The current balance between the two friends.
 * @param {Object} existingExpense - The existing expense object.
 * @param {string} newPayerId - UUID of the new payer in the updated expense.
 * @param {Object} friend - The existing friend relationship object.
 * @returns {number} - The updated balance after applying the new impact.
 */
const applyNewImpact = (currentBalance, existingExpense, newPayerId, friend) => {
  // The following checks if the new payer id is the same as that of friend 1 and if so,
  // it adds the existing debtor amount to apply the new change,
  // otherwise, it subtracts the existing debtor amount to apply the new change.
  return newPayerId === friend.friend1_id ? currentBalance + parseFloat(existingExpense.debtor_amount) : currentBalance - parseFloat(existingExpense.debtor_amount);
};

/**
 * Adjusts the balance for field changes other than payer and debtor swap in the expense.
 *
 * @param {number} currentBalance - The current balance between the two friends.
 * @param {number} debtorAmount - The amount owed by the debtor in the updated expense.
 * @param {Object} existingExpense - The existing expense object.
 * @param {string} newPayerId - UUID of the new payer in the updated expense.
 * @param {Object} friend - The existing friend relationship object.
 * @param {string} type - Type of the expense, e.g., "SETTLEMENT" or other types.
 * @returns {number} - The updated balance after adjusting for field changes.
 */
const adjustForFieldChanges = (currentBalance, debtorAmount, existingExpense, newPayerId, friend, type) => {
  // If the type is not settlement
  if (type !== "SETTLEMENT") {
    // The following code checks if the new payer is the same as the friend1 id and if so,
    // adds the debtor amount to the current balance and substract the existing debtor amount to remove the previous impact,
    // otherwise it substract the debtor amount from the current balance and add the existing debtor amount to remove the previous impact.
    return newPayerId === friend.friend1_id ? currentBalance + debtorAmount - parseFloat(existingExpense.debtor_amount) : currentBalance - (debtorAmount - parseFloat(existingExpense.debtor_amount));
  }
  // If the type is settlement
  // The following code checks if the current balance is greater than 0 and if so,
  // substract the debtor amount from the current balance and add the existing debtor amount to remove the previous impact,
  // otherwise it adds the debtor amount to the current balance and substract the existing debtor amount to remove the previous impact.
  // This ensure that the expense when of settlement type always tries to approach a balance of 0.
  return currentBalance > 0 ? currentBalance - (debtorAmount - parseFloat(existingExpense.debtor_amount)) : currentBalance + debtorAmount - parseFloat(existingExpense.debtor_amount);
};

/**
 * Main function to calculate the updated balance based on new or updated expenses.
 *
 * @param {number} currentBalance - The current balance between the two friends.
 * @param {number} debtorAmount - The amount owed by the debtor.
 * @param {string} newPayerId - UUID of the new payer.
 * @param {Object} friend - The existing friend relationship object.
 * @param {string} type - Type of the expense, e.g., "SETTLEMENT" or other types.
 * @param {Object|null} existingExpense - The existing expense object (if updating an expense).
 * @param {boolean} isUpdate - Whether this is an update to an existing expense.
 * @returns {number} - The updated balance after applying the new or updated expense.
 */
const calculateNewBalance = (
  currentBalance,
  debtorAmount,
  newPayerId,
  friend,
  type,
  existingExpense = null,
  isUpdate = false
) => {
  if (!isUpdate) {
    // New expense
    return calculateForNewEntry(currentBalance, debtorAmount, newPayerId, friend, type);
  }

  let updatedCurrentBalance = currentBalance;

  // The following condition checks if the new payer is changed to the old debtor
  if (newPayerId !== existingExpense.payer_id && existingExpense.debtor_id === newPayerId) {
    // The following reverses the effect of previous changes
    updatedCurrentBalance = reverseOldImpact(updatedCurrentBalance, existingExpense, friend);
    // The following updates the balance based on the new payer
    updatedCurrentBalance = applyNewImpact(updatedCurrentBalance, existingExpense, newPayerId, friend);
  }

  return adjustForFieldChanges(updatedCurrentBalance, debtorAmount, existingExpense, newPayerId, friend, type);
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
      "Settlement amount cannot exceed your current debt."
    );
  } else if (currentBalance > 0 && debtorAmount > currentBalance) {
  // Ensure the debtor amount does not exceed the current balance for positive balances
    throw new ErrorHandler(
      400,
      "Settlement amount cannot exceed your current balance."
    );
  }
};

/**
 * Validates if the friend relationship exists.
 */
const isFriendExist = (friend) => {
  if (!friend) {
    throw new ErrorHandler(404, "Friend not found");
  }
};

/**
 * Validates if the existing expense exists.
 */
const validateExistingExpense = (existingExpense) => {
  if (!existingExpense) {
    throw new ErrorHandler(404, "Expense not found");
  }
};

/**
 * Validates conversation permissions for expense updates.
 */
const validateConversationPermissions = (friend) => {
  if (
    friend.status === "REJECTED" || friend.archival_status !== "NONE" || friend.block_status !== "NONE"
  ) {
    throw new ErrorHandler(403, "This action is not allowed.");
  }
};

/**
 * Validates if the participants are allowed to update the expense.
 */
const validateUpdateParticipants = (updatedExpenseData, friend) => {
  const friendIds = [ friend.friend1_id, friend.friend2_id ];

  if (
    !(
      friendIds.includes(updatedExpenseData.payer_id) && friendIds.includes(updatedExpenseData.debtor_id)
    )
  ) {
    throw new ErrorHandler(403, "You are not allowed to update this expense");
  }
};

/**
 * Checks if balance-affecting fields are being updated.
 */
const isBalanceUpdateRequired = (fields, updatedExpenseData) => {
  return fields.some((field) => field in updatedExpenseData);
};

/**
 * Formats the person's name.
 */
const formatPersonName = (person) => {
  return `${person.first_name} ${person.last_name || ""}`.trim();
};

/**
 * Validates settlement conditions.
 */
const validateSettlement = (updatedExpenseData, currentBalance, debtorAmount) => {
  if (updatedExpenseData.split_type === "SETTLEMENT") {
    if (currentBalance === 0) {
      throw new ErrorHandler(400, "You are all settled up.");
    }
    validateSettlementAmount(currentBalance, debtorAmount);
  }

  if (
    updatedExpenseData.payer_id && updatedExpenseData.debtor_id && updatedExpenseData.payer_id === updatedExpenseData.debtor_id
  ) {
    throw new ErrorHandler(400, "You cannot add an expense with yourself");
  }
};

export {
  formatFriendData,
  getNewStatus,
  calculateDebtorAmount,
  calculateNewBalance,
  validateSettlementAmount,
  formatPersonName,
  isFriendExist,
  validateExistingExpense,
  validateConversationPermissions,
  validateUpdateParticipants,
  isBalanceUpdateRequired,
  validateSettlement
};
