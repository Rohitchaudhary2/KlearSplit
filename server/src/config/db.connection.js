import { Sequelize } from "sequelize";

import { database, host, password, username } from "./db.config.js";
import logger from "../api/utils/logger.js";
import initializeUser from "../api/users/models/userModel.js";
import initializeFriend from "../api/friends/models/friendModel.js";
import initializeFriendMessage from "../api/friends/models/friendMessageModel.js";
import initializeFriendExpense from "../api/friends/models/friendExpenseModel.js";
// import initializeGroup from '../api/groups/models/groupModel.js';

// Creating a new Sequelize instance for connecting to the PostgreSQL database
const sequelize = new Sequelize(database, username, password, {
  host,
  "dialect": "postgres",
  "dialectOptions": {
    "ssl": {
      "require": true,
      "rejectUnauthorized": false
    }
  },
  "logging": false
});

// Associations for the models
const User = initializeUser(sequelize);
const Friend = initializeFriend(sequelize);
const FriendMessage = initializeFriendMessage(sequelize);
const FriendExpense = initializeFriendExpense(sequelize);
// const Group = initializeGroup(sequelize);

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

export { sequelize, User, Friend, FriendMessage, FriendExpense };
