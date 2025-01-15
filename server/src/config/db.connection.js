import { Sequelize } from "sequelize";

import { database, host, password, username } from "./db.config.js";
import logger from "../api/utils/logger.js";
import initializeUser from "../api/users/models/userModel.js";
import initializeFriend from "../api/friends/models/friendModel.js";
import initializeFriendMessage from "../api/friends/models/friendMessageModel.js";
import initializeFriendExpense from "../api/friends/models/friendExpenseModel.js";
import initializeGroup from "../api/groups/models/groupModel.js";
import initializeGroupMember from "../api/groups/models/groupMemberModel.js";
import initializeGroupMessage from "../api/groups/models/groupMessageModel.js";
import initializeGroupMemberBalance from "../api/groups/models/groupMemberBalanceModel.js";
import initializeGroupSettlement from "../api/groups/models/groupSettlementModel.js";
import initializeGroupExpense from "../api/groups/models/groupExpenseModel.js";
import initializeGroupExpenseParticipant from "../api/groups/models/groupExpensePariticpantModel.js";
import initializePayment from "../api/payment/paymentModel.js";
import initializeAuditLog from "../api/audit/auditLogModel.js";

// Creating a new Sequelize instance for connecting to the PostgreSQL database
const sequelize = new Sequelize(database, username, password, {
  host,
  "dialect": "postgres",
  // "dialectOptions": {
  //   "ssl": {
  //     "require": true,
  //     "rejectUnauthorized": false
  //   }
  // },
  "logging": false
});

// Associations for the models
const User = initializeUser(sequelize);
const Friend = initializeFriend(sequelize);
const FriendMessage = initializeFriendMessage(sequelize);
const FriendExpense = initializeFriendExpense(sequelize);
const Group = initializeGroup(sequelize);
const GroupMember = initializeGroupMember(sequelize);
const GroupMessage = initializeGroupMessage(sequelize);
const GroupMemberBalance = initializeGroupMemberBalance(sequelize);
const GroupSettlement = initializeGroupSettlement(sequelize);
const GroupExpense = initializeGroupExpense(sequelize);
const GroupExpenseParticipant = initializeGroupExpenseParticipant(sequelize);
const Payment = initializePayment(sequelize);
const AuditLog = initializeAuditLog(sequelize);

// User model association with Audit Log model
User.hasMany(AuditLog, { "foreignKey": "actor_id" });
AuditLog.belongsTo(User, { "foreignKey": "actor_id" });

// User model association with Friends model
User.hasMany(Friend, { "foreignKey": "friend1_id" });
User.hasMany(Friend, { "foreignKey": "friend2_id" });
Friend.belongsTo(User, { "foreignKey": "friend1_id", "as": "friend1" });
Friend.belongsTo(User, { "foreignKey": "friend2_id", "as": "friend2" });

// Friend Messages model associations with User and Friend models
User.hasMany(FriendMessage, { "foreignKey": "sender_id" });
Friend.hasMany(FriendMessage, { "foreignKey": "conversation_id" });
FriendMessage.belongsTo(User, { "foreignKey": "sender_id", "as": "sender" });
FriendMessage.belongsTo(Friend, {
  "foreignKey": "conversation_id",
  "as": "conversation"
});

// Friend Expenses model association with User and Friend models
User.hasMany(FriendExpense, { "foreignKey": "payer_id" });
User.hasMany(FriendExpense, { "foreignKey": "debtor_id" });
Friend.hasMany(FriendExpense, { "foreignKey": "conversation_id" });
FriendExpense.belongsTo(User, { "foreignKey": "payer_id", "as": "payer" });
FriendExpense.belongsTo(User, { "foreignKey": "debtor_id", "as": "debtor" });
FriendExpense.belongsTo(Friend, {
  "foreignKey": "conversation_id",
  "as": "conversation"
});

// Group model
User.hasMany(Group, { "foreignKey": "creator_id" });
Group.belongsTo(User, { "foreignKey": "creator_id" });

// Group Member model
User.hasMany(GroupMember, { "foreignKey": "member_id" });
Group.hasMany(GroupMember, { "foreignKey": "group_id" });
GroupMember.hasMany(GroupMember, { "foreignKey": "inviter_id" });
GroupMember.belongsTo(User, { "foreignKey": "member_id" });
GroupMember.belongsTo(Group, { "foreignKey": "group_id" });
GroupMember.belongsTo(GroupMember, { "foreignKey": "inviter_id" });

// Group Message model
Group.hasMany(GroupMessage, { "foreignKey": "group_id" });
GroupMember.hasMany(GroupMessage, { "foreignKey": "sender_id" });
GroupMessage.belongsTo(Group, { "foreignKey": "group_id" });
GroupMessage.belongsTo(GroupMember, { "foreignKey": "sender_id" });

// Group Member Balance
Group.hasMany(GroupMemberBalance, { "foreignKey": "group_id" });
GroupMember.hasMany(GroupMemberBalance, { "foreignKey": "participant1_id" });
GroupMember.hasMany(GroupMemberBalance, { "foreignKey": "participant2_id" });
GroupMemberBalance.belongsTo(Group, { "foreignKey": "group_id" });
GroupMemberBalance.belongsTo(GroupMember, { "foreignKey": "participant1_id" });
GroupMemberBalance.belongsTo(GroupMember, { "foreignKey": "participant2_id" });

// Group Settlements
Group.hasMany(GroupSettlement, { "foreignKey": "group_id" });
GroupMember.hasMany(GroupSettlement, { "foreignKey": "payer_id" });
GroupMember.hasMany(GroupSettlement, { "foreignKey": "debtor_id" });
GroupSettlement.belongsTo(Group, { "foreignKey": "group_id" });
GroupSettlement.belongsTo(GroupMember, { "foreignKey": "payer_id" });
GroupSettlement.belongsTo(GroupMember, { "foreignKey": "debtor_id" });

// Group Expense
Group.hasMany(GroupExpense, { "foreignKey": "group_id" });
GroupMember.hasMany(GroupExpense, { "foreignKey": "payer_id" });
GroupExpense.belongsTo(Group, { "foreignKey": "group_id" });
GroupExpense.belongsTo(GroupMember, { "foreignKey": "payer_id" });

// Group Expense Participants
GroupMember.hasMany(GroupExpenseParticipant, { "foreignKey": "debtor_id" });
GroupExpense.hasMany(GroupExpenseParticipant, { "foreignKey": "group_expense_id" });
GroupExpenseParticipant.belongsTo(GroupMember, { "foreignKey": "debtor_id" });
GroupExpenseParticipant.belongsTo(GroupExpense, { "foreignKey": "group_expense_id" });

// Payment
User.hasMany(Payment, { "foreignKey": "payer_id" });
User.hasMany(Payment, { "foreignKey": "payee_id" });
FriendExpense.hasOne(Payment, { "foreignKey": "friend_settlement_id" });
GroupSettlement.hasOne(Payment, { "foreignKey": "group_settlement_id" });
Payment.belongsTo(User, { "foreignKey": "payer_id" });
Payment.belongsTo(User, { "foreignKey": "payee_id" });
Payment.belongsTo(FriendExpense, { "foreignKey": "friend_settlement_id" });
Payment.belongsTo(GroupSettlement, { "foreignKey": "group_settlement_id" });

try {
  await sequelize.authenticate(); // Attempting to authenticate the connection to the database
  logger.log({
    "level": "info",
    "message": JSON.stringify({
      "statusCode": 200,
      "message": "Connection has been established successfully."
    })
  });
} catch {
  logger.log({
    "level": "error",
    "message": JSON.stringify({
      "statusCode": 503,
      "message": "Service unavailable. Unable to connect to the database."
    })
  });
}

export { sequelize, User, Friend, FriendMessage, FriendExpense, Group, GroupMember, GroupMemberBalance, GroupMessage, GroupExpense, GroupExpenseParticipant, GroupSettlement, Payment, AuditLog };
