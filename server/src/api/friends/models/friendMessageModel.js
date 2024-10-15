import { DataTypes } from "sequelize";

import sequelize from "../../../config/db.connection.js";
import Friend from "./friendModel.js";
import User from "../../users/models/userModel.js";

const FriendMessage = sequelize.define(
  "friends_messages",
  {
    message_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "friends",
        key: "conversation_id",
      },
      onDelete: "CASCADE",
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
      onDelete: "CASCADE",
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    paranoid: true,
    defaultScope: {
      attributes: {
        exclude: ["createdAt", "updatedAt", "deletedAt"],
      },
    },
  },
);

FriendMessage.belongsTo(Friend, {
  foreignKey: "conversation_id",
  as: "conversation", // Alias for conversation
});

FriendMessage.belongsTo(User, {
  foreignKey: "sender_id",
  as: "sender", // Alias for sender
});

export default FriendMessage;
