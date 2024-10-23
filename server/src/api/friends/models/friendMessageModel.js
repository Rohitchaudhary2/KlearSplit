import { DataTypes } from "sequelize";

export default (sequelize) => {
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
        type: DataTypes.STRING(512),
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
          exclude: ["updatedAt", "deletedAt"],
        },
      },
    },
  );
  return FriendMessage;
};
