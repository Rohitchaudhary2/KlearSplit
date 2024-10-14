import sequelize from "../../config/db.connection.js";
import { ErrorHandler } from "../middlewares/errorHandler.js";
import UserDb from "../users/userDb.js";
import { responseHandler } from "../utils/responseHandler.js";
import FriendDb from "./friendDb.js";

class FriendService {
  // Service to add a friend
  static addFriend = async (res, friendData) => {
    const friendRequestTo = await UserDb.getUserByEmail(friendData.email);
    if (!friendRequestTo) throw new ErrorHandler(404, "User not found");
    const newFriendData = {
      friend1_id: friendData.user_id,
      friend2_id: friendRequestTo.user_id,
    };
    const friendExist = await this.checkFriendExist(newFriendData);
    if (friendExist)
      responseHandler(res, 409, "Friend already exist", friendExist);
    const friend = await FriendDb.addFriend(newFriendData);
    return friend;
  };

  // Service to check whether friend already exists
  static checkFriendExist = async (friendData) =>
    await FriendDb.checkFriendExist(friendData);

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
      friendRequest.user_id === friendRequestExist.dataValues.friend2_id &&
      (friendRequest.status === "ACCEPTED" ||
        friendRequest.status === "REJECTED")
    ) {
      const friendRequestUpdate = await FriendDb.updateFriends(
        { status },
        conversation_id,
      );
      return friendRequestUpdate;
    }
    throw new ErrorHandler(400, "Invalid request");
  };

  // Service to withdraw friend request
  static withdrawFriendRequest = async (friendRequest) => {
    const { conversation_id } = friendRequest;
    const friendRequestExist = await FriendDb.getFriend(conversation_id);
    if (!friendRequestExist)
      throw new ErrorHandler(404, "Friend request not found");
    if (
      friendRequest.user_id === friendRequestExist.dataValues.friend1_id &&
      friendRequestExist.dataValues.status === "PENDING"
    ) {
      const friendRequestDelete =
        await FriendDb.withdrawFriendRequest(friendRequest);
      return friendRequestDelete;
    }
    throw new ErrorHandler(400, "Invalid request");
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
    if (parseFloat(friendExist.dataValues.balance_amount) === 0) {
      const friendUpdate = await FriendDb.updateFriends(
        { [statusField]: newStatus },
        conversation_id,
      );
      return friendUpdate;
    }
    throw new ErrorHandler(400, "Invalid request");
  };

  // Service to save messages in db
  static saveMessage = async (messageData) => {
    const { conversation_id } = messageData;
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend doesn't exist");
    if (friendExist.dataValues.status !== "ACCEPTED")
      throw new ErrorHandler(400, "Not allowed to send message");

    const message = await FriendDb.addMessage(messageData);

    return message;
  };

  // Service to fetch all the messages of a particular conversation
  static getMessages = async (conversation_id) => {
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend doesn't exist");
    if (friendExist.dataValues.status !== "ACCEPTED")
      throw new ErrorHandler(404, "No messages allowed");
    const messages = await FriendDb.getMessages(conversation_id);

    return messages.map((message) => {
      return {
        message_id: message.dataValues.message_id,
        sender_id: message.dataValues.sender_id,
        conversation_id: message.dataValues.conversation_id,
        message: message.dataValues.message,
        is_read: message.dataValues.is_read,
      };
    });
  };

  // Service to add expenses
  // static addExpense = async (expenseData, conversation_id) => {
  //   const friendExist = await FriendDb.getFriend(conversation_id);
  //   if (!friendExist) throw new ErrorHandler(404, "Friend not found");
  //   const transaction = await sequelize.transaction();
  //   if (expenseData.payer_id === friendExist.dataValues.friend1_id) {
  //     if (expenseData.split_type === "EQUAL") {
  //       const debtor_amount = parseFloat(expenseData.total_amount) / 2;
  //       expenseData.debtor_amount = debtor_amount;
  //       try {
  //         const expense = await FriendDb.addExpense(expenseData, transaction);
  //         const balance_amount = friendExist.balance_amount + debtor_amount;
  //         await FriendDb.updateFriends({ balance_amount }, conversation_id, transaction);
  //         await transaction.commit();
  //         return expense;
  //       } catch (error) {
  //         // Rollback the transaction in case of error
  //         await transaction.rollback();
  //         throw error; // Rethrow the error after rollback
  //       }
  //     } else if (expenseData.split_type === "UNEQUAL") {
  //       const debtor_amount = parseFloat(expenseData.debtor_amount);
  //       expenseData.debtor_amount = debtor_amount;
  //       try {
  //         const expense = await FriendDb.addExpense(expenseData, transaction);
  //         const balance_amount = friendExist.balance_amount + debtor_amount;
  //         await FriendDb.updateFriends({ balance_amount }, conversation_id, transaction);
  //         await transaction.commit();
  //         return expense;
  //       } catch (error) {
  //         // Rollback the transaction in case of error
  //         await transaction.rollback();
  //         throw error; // Rethrow the error after rollback
  //       }
  //     } else if (expenseData.split_type === "PERCENTAGE") {
  //       const debtor_amount = parseFloat(expenseData.total_amount) * parseFloat(expenseData.debtor_percentage) / 100;
  //       expenseData.debtor_amount = debtor_amount;
  //       try {
  //         const expense = await FriendDb.addExpense(expenseData, transaction);
  //         const balance_amount = friendExist.balance_amount + debtor_amount;
  //         await FriendDb.updateFriends({ balance_amount }, conversation_id, transaction);
  //         await transaction.commit();
  //         return expense;
  //       } catch (error) {
  //         // Rollback the transaction in case of error
  //         await transaction.rollback();
  //         throw error; // Rethrow the error after rollback
  //       }
  //     } else {
  //       throw new ErrorHandler(400, "Split type not recognized");
  //     }
  //   } else {
  //     if (expenseData.split_type === "EQUAL") {
  //       const debtor_amount = parseFloat(expenseData.total_amount) / 2;
  //       expenseData.debtor_amount = debtor_amount;
  //       try {
  //         const expense = await FriendDb.addExpense(expenseData, transaction);
  //         const balance_amount = friendExist.balance_amount - debtor_amount;
  //         await FriendDb.updateFriends({ balance_amount }, conversation_id, transaction);
  //         await transaction.commit();
  //         return expense;
  //       } catch (error) {
  //         // Rollback the transaction in case of error
  //         await transaction.rollback();
  //         throw error; // Rethrow the error after rollback
  //       }
  //     } else if (expenseData.split_type === "UNEQUAL") {
  //       const debtor_amount = parseFloat(expenseData.debtor_amount);
  //       expenseData.debtor_amount = debtor_amount;
  //       try {
  //         const expense = await FriendDb.addExpense(expenseData, transaction);
  //         const balance_amount = friendExist.balance_amount - debtor_amount;
  //         await FriendDb.updateFriends({ balance_amount }, conversation_id, transaction);
  //         await transaction.commit();
  //         return expense;
  //       } catch (error) {
  //         // Rollback the transaction in case of error
  //         await transaction.rollback();
  //         throw error; // Rethrow the error after rollback
  //       }
  //     } else if (expenseData.split_type === "PERCENTAGE") {
  //       const debtor_amount = parseFloat(expenseData.total_amount) * parseFloat(expenseData.debtor_percentage) / 100;
  //       expenseData.debtor_amount = debtor_amount;
  //       try {
  //         const expense = await FriendDb.addExpense(expenseData, transaction);
  //         const balance_amount = friendExist.balance_amount - debtor_amount;
  //         await FriendDb.updateFriends({ balance_amount }, conversation_id, transaction);
  //         await transaction.commit();
  //         return expense;
  //       } catch (error) {
  //         // Rollback the transaction in case of error
  //         await transaction.rollback();
  //         throw error; // Rethrow the error after rollback
  //       }
  //     } else {
  //       throw new ErrorHandler(400, "Split type not recognized");
  //     }
  //   }
  // }
  static addExpense = async (expenseData, conversation_id) => {
    const friendExist = await FriendDb.getFriend(conversation_id);
    if (!friendExist) throw new ErrorHandler(404, "Friend not found");

    if (
      friendExist.status === "ACCEPTED" &&
      friendExist.archival_status === "NONE" &&
      friendExist.block_status === "NONE"
    ) {
      const transaction = await sequelize.transaction();
      try {
        const debtorAmount = calculateDebtorAmount(expenseData);
        expenseData.debtor_amount = debtorAmount;

        const expense = await FriendDb.addExpense(expenseData, transaction);
        const balanceAmount = calculateNewBalance(
          parseFloat(friendExist.balance_amount),
          debtorAmount,
          expenseData.payer_id,
          friendExist,
        );

        await FriendDb.updateFriends(
          { balance_amount: balanceAmount },
          conversation_id,
          transaction,
        );
        await transaction.commit();

        return expense;
      } catch (error) {
        // Rollback the transaction in case of error
        await transaction.rollback();
        throw error; // Rethrow the error after rollback
      }
    } else {
      throw new ErrorHandler(400, "Friend status not recognized");
    }
  };
}

// Helper function to calculate the debtor amount based on split type
const calculateDebtorAmount = (expenseData) => {
  const totalAmount = parseFloat(expenseData.total_amount);
  switch (expenseData.split_type) {
    case "EQUAL":
      return totalAmount / 2;
    case "UNEQUAL":
      return parseFloat(expenseData.debtor_amount);
    case "PERCENTAGE":
      return (totalAmount * parseFloat(expenseData.debtor_percentage)) / 100;
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
) => {
  // If the payer is friend1, add the debtor amount, otherwise subtract it
  const newBalance =
    payerId === friendExist.friend1_id
      ? currentBalance + debtorAmount
      : currentBalance - debtorAmount;
  return newBalance;
};

export default FriendService;
