import { sequelize } from "../../config/db.connection.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";
import UserDb from "../users/userDb.js";
import { hashedPassword } from "../utils/hashPassword.js";
import { generatePassword } from "../utils/passwordGenerator.js";
import sendMail from "../utils/sendMail.js";
import FriendDb from "./friendDb.js";

class FriendService {
  // Service to add a friend
  static addFriend = async (friendData) => {
    let friendRequestTo = await UserDb.getUserByEmail(friendData.email);
    if (!friendRequestTo) {
      //Generating random password
      const password = generatePassword();

      //Hashing the password
      const hashPassword = await hashedPassword(password);
      friendRequestTo = await UserDb.createUser({
        first_name: "Invited_Friend",
        email: friendData.email,
        is_invited: true,
        password: hashPassword,
      });

      const options = {
        email: friendRequestTo.email,
        subject: "Invited on KlearSplit",
      };

      const sender = `${friendData.first_name}${friendData.last_name ? ` ${friendData.last_name}` : ""}`;

      sendMail(options, "invitationTemplate", {
        name: friendRequestTo.first_name,
        sender,
      });
    }

    const newFriendData = {
      friend1_id: friendData.user_id,
      friend2_id: friendRequestTo.user_id,
    };
    if (newFriendData.friend1_id === newFriendData.friend2_id)
      throw new ErrorHandler(400, "You cannot add yourself as a friend.");
    const friendExist = await this.checkFriendExist(newFriendData, false);
    if (friendExist && !friendExist.dataValues.deletedAt)
      throw new ErrorHandler(409, "Friend already exist");
    if (friendExist && friendExist.dataValues.deletedAt) {
      return await FriendDb.restoreFriend(friendExist);
    }
    const friend = await FriendDb.addFriend(newFriendData);
    return friend;
  };

  // Service to check whether friend already exists
  static checkFriendExist = async (friendData, flag) =>
    await FriendDb.checkFriendExist(friendData, flag);

  // Service to get all friends
  static getAllFriends = async (userId, filters) => {
    const friends = await FriendDb.getAllFriends(userId, filters);

    // Map the result to pick the actual friend (either friend1 or friend2)
    return friends.map((friend) => {
      const actualFriend = friend.friend1 || friend.friend2; // Pick the one that's not null
      return {
        conversation_id: friend.conversation_id,
        status: friend.friend1 ? "RECEIVER" : "SENDER",
        balance_amount:
          userId === friend.friend1_id
            ? friend.balance_amount
            : -friend.balance_amount,
        archival_status: friend.archival_status,
        block_status: friend.block_status,
        friend: {
          user_id: actualFriend.user_id,
          first_name: actualFriend.first_name,
          last_name: actualFriend.last_name,
          email: actualFriend.email,
          image_url: actualFriend.image_url,
        },
      };
    });
  };

  // Service to accept and reject friend requests
  static acceptRejectFriendRequest = async (friendRequest) => {
    const { conversation_id, status } = friendRequest;
    const friendRequestExist = await FriendDb.getFriend(conversation_id);
    if (!friendRequestExist)
      throw new ErrorHandler(404, "Friend request not found");
    if (
      friendRequest.user_id !== friendRequestExist.dataValues.friend2_id ||
      friendRequest.status === "PENDING"
    ) {
      throw new ErrorHandler(400, "Invalid request");
    }
    const friendRequestUpdate = await FriendDb.updateFriends(
      { status },
      conversation_id,
    );
    return friendRequestUpdate;
  };

  // Service to withdraw friend request
  static withdrawFriendRequest = async (friendRequest) => {
    const { conversation_id } = friendRequest;
    const friendRequestExist = await FriendDb.getFriend(conversation_id);
    if (!friendRequestExist)
      throw new ErrorHandler(404, "Friend request not found");
    if (
      friendRequest.user_id !== friendRequestExist.dataValues.friend1_id ||
      friendRequestExist.dataValues.status !== "PENDING"
    ) {
      throw new ErrorHandler(400, "Invalid request");
    }
    const friendRequestDelete = await FriendDb.withdrawFriendRequest(
      friendRequest,
      friendRequestExist,
    );
    return friendRequestDelete;
  };

  // Service for archiving/blocking or unarchiving/unblocking a friend
  static archiveBlockFriend = async (friend) => {
    const { user_id, type, conversation_id } = friend;
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend doesn't exist");
    const statusField =
      type === "archived" ? "archival_status" : "block_status";

    let newStatus;
    if (user_id === friendExist.dataValues.friend1_id) {
      if (friendExist[statusField] === "NONE") {
        newStatus = "FRIEND1";
      } else if (friendExist[statusField] === "FRIEND2") {
        newStatus = "BOTH";
      } else if (friendExist[statusField] === "FRIEND1") {
        newStatus = "NONE";
      } else if (friendExist[statusField] === "BOTH") {
        newStatus = "FRIEND2";
      } else {
        throw new ErrorHandler(400, "Invalid status field");
      }
    } else {
      if (friendExist[statusField] === "NONE") {
        newStatus = "FRIEND2";
      } else if (friendExist[statusField] === "FRIEND1") {
        newStatus = "BOTH";
      } else if (friendExist[statusField] === "FRIEND2") {
        newStatus = "NONE";
      } else if (friendExist[statusField] === "BOTH") {
        newStatus = "FRIEND1";
      } else {
        throw new ErrorHandler(400, "Invalid status field");
      }
    }
    if (parseFloat(friendExist.dataValues.balance_amount) !== 0) {
      throw new ErrorHandler(400, "Settle up before this action!");
    }
    const friendUpdate = await FriendDb.updateFriends(
      { [statusField]: newStatus },
      conversation_id,
    );
    return friendUpdate;
  };

  // Service to save messages in db
  static saveMessage = async (messageData) => {
    const { conversation_id } = messageData;
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend doesn't exist");
    if (friendExist.dataValues.status === "REJECTED")
      throw new ErrorHandler(400, "Not allowed to send message");

    const message = await FriendDb.addMessage(messageData);

    return message;
  };

  // Service to fetch all the messages of a particular conversation
  static getMessages = async (conversation_id, page, pageSize) => {
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend doesn't exist");
    if (friendExist.dataValues.status === "REJECTED")
      throw new ErrorHandler(
        403,
        "You are not allowed to message in this chat.",
      );
    const messages = await FriendDb.getMessages(
      conversation_id,
      page,
      pageSize,
    );

    return messages.map((message) => {
      return {
        message_id: message.dataValues.message_id,
        sender_id: message.dataValues.sender_id,
        conversation_id: message.dataValues.conversation_id,
        message: message.dataValues.message,
        is_read: message.dataValues.is_read,
        createdAt: message.dataValues.createdAt,
      };
    });
  };

  // Service to add expenses in a particular conversation
  static addExpense = async (expenseData, conversation_id) => {
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend not found");
    expenseData.conversation_id = conversation_id;

    if (
      friendExist.status === "REJECTED" ||
      friendExist.archival_status !== "NONE" ||
      friendExist.block_status !== "NONE"
    ) {
      throw new ErrorHandler(403, "This action is not allowed.");
    }
    if (
      expenseData.payer_id !== friendExist.friend1_id &&
      expenseData.payer_id !== friendExist.friend2_id
    ) {
      throw new ErrorHandler(
        400,
        "You are not allowed to add expense in this chat.",
      );
    }
    const transaction = await sequelize.transaction();
    try {
      const debtorAmount = calculateDebtorAmount(expenseData);
      expenseData.debtor_amount = debtorAmount;

      const currentBalance = parseFloat(friendExist.balance_amount);
      if (expenseData.split_type === "SETTLEMENT") {
        if (currentBalance === 0) {
          return { message: "You are all settled up." };
        }
        validateSettlementAmount(currentBalance, debtorAmount);
        expenseData.expense_name = "Settlement";
        expenseData.payer_id =
          currentBalance > 0 ? friendExist.friend2_id : friendExist.friend1_id;
        expenseData.debtor_id =
          currentBalance > 0 ? friendExist.friend1_id : friendExist.friend2_id;
      }

      if (expenseData.payer_id === expenseData.debtor_id) {
        throw new ErrorHandler(400, "You cannot add an expense with yourself");
      }

      const expense = await FriendDb.addExpense(expenseData, transaction);
      const balanceAmount = calculateNewBalance(
        currentBalance,
        debtorAmount,
        expenseData.payer_id,
        friendExist,
        expenseData.split_type,
      );

      await FriendDb.updateFriends(
        { balance_amount: balanceAmount },
        conversation_id,
        transaction,
      );
      await transaction.commit();

      return expense;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  // Service to fetch all expenses for a conversation
  static getExpenses = async (conversation_id, page, pageSize, fetchAll) => {
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend not found");
    if (friendExist.status === "REJECTED") {
      throw new ErrorHandler(
        403,
        "You are not allowed to view this conversation.",
      );
    }
    const expenses = await FriendDb.getExpenses(
      conversation_id,
      page,
      pageSize,
      fetchAll,
    );
    const expensesToSend = expenses.map((expense) => expense.toJSON());
    return expensesToSend.map((expense) => ({
      ...expense,
      payer:
        `${expense.payer.first_name} ${expense.payer.last_name || ""}`.trim(),
    }));
  };

  // Service to update a friend expense
  static updateExpense = async (updatedExpenseData, conversation_id) => {
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) {
      throw new ErrorHandler(404, "Friend not found");
    }
    const existingExpense = await FriendDb.getExpense(
      updatedExpenseData.friend_expense_id,
    );
    if (!existingExpense) {
      throw new ErrorHandler(404, "Expense not found");
    }

    const balanceAffectingFields = [
      "total_amount",
      "payer_id",
      "debtor_id",
      "split_type",
      "participant1_share",
      "participant2_share",
      "debtor_share",
    ];

    // Check if balance-related fields are being updated
    const requiresBalanceUpdate = balanceAffectingFields.some(
      (field) => field in updatedExpenseData,
    );
    if (
      (existingExpense.payer_id === friendExist.friend1_id &&
        existingExpense.debtor_id === friendExist.friend2_id) ||
      (existingExpense.payer_id === friendExist.friend2_id &&
        existingExpense.debtor_id === friendExist.friend1_id)
    ) {
      // Only non-balance fields are being updated, skip transaction
      if (!requiresBalanceUpdate) {
        const { affectedRows, updatedExpense } = await FriendDb.updateExpense(
          updatedExpenseData,
          updatedExpenseData.friend_expense_id,
        );

        if (affectedRows === 0) {
          throw new ErrorHandler(400, "Failed to update expense");
        }
        return updatedExpense;
      }

      // Balance-related fields need an update, use a transaction
      const transaction = await sequelize.transaction();
      try {
        const debtorAmount = calculateDebtorAmount(
          updatedExpenseData,
          existingExpense,
        );
        updatedExpenseData.debtor_amount = debtorAmount;

        const currentBalance = parseFloat(friendExist.balance_amount);

        if (updatedExpenseData.split_type === "SETTLEMENT") {
          if (currentBalance === 0) {
            throw new ErrorHandler(400, "You are all settled up.");
          }
          validateSettlementAmount(currentBalance, debtorAmount);
        }

        if (
          updatedExpenseData.payer_id &&
          updatedExpenseData.debtor_id &&
          updatedExpenseData.payer_id === updatedExpenseData.debtor_id
        ) {
          throw new ErrorHandler(
            400,
            "You cannot add an expense with yourself",
          );
        }

        const newBalance = calculateNewBalance(
          currentBalance,
          debtorAmount,
          updatedExpenseData.payer_id || existingExpense.payer_id,
          friendExist,
          updatedExpenseData.split_type || existingExpense.split_type,
          existingExpense,
          true,
        );

        // Update the expense with a transaction
        const { affectedRows, updatedExpense } = await FriendDb.updateExpense(
          updatedExpenseData,
          updatedExpenseData.friend_expense_id,
          transaction,
        );

        if (affectedRows === 0) {
          throw new ErrorHandler(400, "Failed to update expense");
        }

        // Update the balance in the friends table
        await FriendDb.updateFriends(
          { balance_amount: newBalance },
          friendExist.conversation_id,
          transaction,
        );

        // Commit the transaction
        await transaction.commit();

        return updatedExpense;
      } catch (error) {
        // Rollback the transaction in case of any error
        await transaction.rollback();
        throw error;
      }
    } else {
      throw new ErrorHandler(403, "You are not allowed to update this expense");
    }
  };

  // Service to delete a friend expense
  static deleteExpense = async (conversation_id, friend_expense_id) => {
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend not found");

    const existingExpense = await FriendDb.getExpense(friend_expense_id);
    if (!existingExpense) throw new ErrorHandler(404, "Expense not found");

    if (friendExist.conversation_id !== existingExpense.conversation_id) {
      throw new ErrorHandler(403, "You are not allowed to delete this expense");
    }
    const transaction = await sequelize.transaction();
    try {
      // Delete the expense
      const { affectedRows } = await FriendDb.deleteExpense(
        friend_expense_id,
        transaction,
      );
      if (affectedRows === 0) {
        throw new ErrorHandler(400, "Failed to delete expense");
      }
      // Update the balance in the friends table
      await FriendDb.updateFriends(
        {
          balance_amount:
            existingExpense.payer_id === friendExist.friend1_id
              ? parseFloat(friendExist.balance_amount) -
                parseFloat(existingExpense.debtor_amount)
              : parseFloat(friendExist.balance_amount) +
                parseFloat(existingExpense.debtor_amount),
        },
        conversation_id,
        transaction,
      );
      // Commit the transaction
      await transaction.commit();
      return { message: "Expense deleted successfully" };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  // Service to fetch both expenses and messages together
  static getBoth = async (conversation_id, page = 1, pageSize = 20) => {
    const totalMessages = await FriendDb.countMessages(conversation_id);
    const totalExpenses = await FriendDb.countExpenses(conversation_id);
    const totalItems = totalMessages + totalExpenses;
    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;

    // Check if the page request is valid
    if (offset >= totalItems) {
      return {
        data: [],
        currentPage: page,
        totalPages,
        totalItems,
        message: "No more data available.",
      };
    }

    const messages = await this.getMessages(conversation_id, 1, pageSize * 2);
    const expenses = await this.getExpenses(conversation_id, 1, pageSize * 2);
    const messagesAndExpenses = [...messages, ...expenses];
    messagesAndExpenses.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const paginatedResult = messagesAndExpenses.slice(
      offset,
      offset + pageSize,
    );
    return paginatedResult;
  };
}

// Helper function to calculate the debtor amount based on split type
const calculateDebtorAmount = (expenseData, existingExpense = null) => {
  const totalAmount =
    parseFloat(expenseData.total_amount) ||
    parseFloat(existingExpense.total_amount);
  expenseData.split_type = expenseData.split_type || existingExpense.split_type;
  switch (expenseData.split_type) {
    case "EQUAL":
      return totalAmount / 2;
    case "UNEQUAL":
      if (
        parseFloat(expenseData.participant1_share) +
          parseFloat(expenseData.participant2_share) ===
          totalAmount &&
        (expenseData.debtor_share === expenseData.participant1_share ||
          expenseData.debtor_share === expenseData.participant2_share)
      ) {
        return parseFloat(expenseData.debtor_share);
      } else {
        throw new ErrorHandler(
          400,
          "The debtor share and payer share do not add up to the total amount.",
        );
      }
    case "PERCENTAGE":
      if (
        parseFloat(expenseData.participant1_share) +
          parseFloat(expenseData.participant2_share) ===
          100 &&
        (expenseData.debtor_share === expenseData.participant1_share ||
          expenseData.debtor_share === expenseData.participant2_share)
      ) {
        return (totalAmount * parseFloat(expenseData.debtor_share)) / 100;
      } else {
        throw new ErrorHandler(
          400,
          "The debtor share and payer share do not add up to 100.",
        );
      }
    case "SETTLEMENT":
      return totalAmount;
    default:
      throw new ErrorHandler(400, "Split type not recognized");
  }
};

// Helper function to calculate the new balance based on the payer
const calculateNewBalance = (
  currentBalance,
  debtorAmount,
  payerId,
  friendExist,
  type,
  existingExpense = null,
  isUpdate = false,
) => {
  if (!isUpdate) {
    // If the payer is friend1, add the debtor amount, otherwise subtract it
    if (type !== "SETTLEMENT") {
      const newBalance =
        payerId === friendExist.friend1_id
          ? currentBalance + debtorAmount
          : currentBalance - debtorAmount;
      return newBalance;
    } else {
      const newBalance =
        currentBalance > 0
          ? currentBalance - debtorAmount
          : currentBalance + debtorAmount;

      return newBalance;
    }
  } else {
    if (type !== "SETTLEMENT") {
      const newBalance =
        payerId === existingExpense.debtor_id
          ? payerId === friendExist.friend1_id
            ? currentBalance + debtorAmount * 2
            : currentBalance - debtorAmount * 2
          : payerId === friendExist.friend1_id
            ? currentBalance +
              debtorAmount -
              parseFloat(existingExpense.debtor_amount)
            : currentBalance -
              debtorAmount +
              parseFloat(existingExpense.debtor_amount);
      return newBalance;
    } else {
      const newBalance =
        currentBalance > 0
          ? currentBalance -
            debtorAmount +
            parseFloat(existingExpense.debtor_amount)
          : currentBalance +
            debtorAmount -
            parseFloat(existingExpense.debtor_amount);
      return newBalance;
    }
  }
};

// Helper function to validate settlement amount
const validateSettlementAmount = (currentBalance, debtorAmount) => {
  if (currentBalance < 0 && debtorAmount > Math.abs(currentBalance)) {
    throw new ErrorHandler(
      400,
      "Settlement amount cannot exceed your current debt.",
    );
  } else if (currentBalance > 0 && debtorAmount > currentBalance) {
    throw new ErrorHandler(
      400,
      "Settlement amount cannot exceed your current balance.",
    );
  }
};

export default FriendService;
