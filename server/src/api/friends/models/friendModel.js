import { DataTypes } from "sequelize";

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
    },
  );

  return Friend;
};
