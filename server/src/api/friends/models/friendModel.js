import { DataTypes, Op } from "sequelize";
import { FriendExpense, FriendMessage } from "../../../config/db.connection.js";

export default (sequelize) => {
  const Friend = sequelize.define(
    "friends",
    {
      conversation_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      friend1_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
      },
      friend2_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
      },
      status: {
        type: DataTypes.ENUM("PENDING", "ACCEPTED", "REJECTED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      balance_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      archival_status: {
        type: DataTypes.ENUM("NONE", "FRIEND1", "FRIEND2", "BOTH"),
        allowNull: false,
        defaultValue: "NONE",
      },
      block_status: {
        type: DataTypes.ENUM("NONE", "FRIEND1", "FRIEND2", "BOTH"),
        allowNull: false,
        defaultValue: "NONE",
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
      scopes: {
        withDeletedAt: {
          attributes: {},
        },
      },
    },
  );

  Friend.beforeDestroy(async (conversation, options) => {
    const transaction = options.transaction;
    const conversation_id = conversation.conversation_id;

    // Soft delete friends where the conversation is either friend1 or friend2
    await FriendMessage.update(
      { deletedAt: new Date() },
      {
        where: {
          conversation_id,
        },
        transaction,
      },
    );
    await FriendExpense.update(
      { deletedAt: new Date(), is_deleted: 1 },
      {
        where: {
          [Op.and]: [{ conversation_id }, { is_deleted: 0 }],
        },
        transaction,
      },
    );
  });

  Friend.afterRestore(async (conversation, options) => {
    const transaction = options.transaction;
    const conversation_id = conversation.conversation_id;

    // Soft delete friends where the conversation is either friend1 or friend2
    await FriendMessage.update(
      { deletedAt: null },
      {
        where: {
          conversation_id,
        },
        transaction,
        paranoid: false,
      },
    );
    await FriendExpense.update(
      { deletedAt: null, is_deleted: 0 },
      {
        where: {
          [Op.and]: [{ conversation_id }, { is_deleted: 1 }],
        },
        transaction,
        paranoid: false,
      },
    );
  });

  return Friend;
};
