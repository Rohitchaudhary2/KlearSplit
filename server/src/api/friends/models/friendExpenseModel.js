import { DataTypes } from "sequelize";

export default (sequelize) => {
  const FriendExpense = sequelize.define(
    "friends_expenses",
    {
      friend_expense_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      expense_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Expense name can't be empty.",
          },
        },
      },
      total_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Total amount can't be empty.",
          },
          isNumeric: {
            msg: "Total amount must be a number.",
          },
        },
      },
      description: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      conversation_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "friends",
          key: "conversation_id",
        },
      },
      payer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
      },
      debtor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
      },
      split_type: {
        type: DataTypes.ENUM("EQUAL", "UNEQUAL", "PERCENTAGE", "SETTLEMENT"),
        allowNull: false,
        defaultValue: "EQUAL",
      },
      debtor_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      receipt_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      timestamps: true,
      paranoid: true,
      defaultScope: {
        attributes: {
          exclude: ["deletedAt"],
        },
      },
    },
  );

  return FriendExpense;
};
