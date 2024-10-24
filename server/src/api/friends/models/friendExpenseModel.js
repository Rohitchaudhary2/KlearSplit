import { DataTypes } from "sequelize";

import sequelize from "../../../config/db.connection.js";
import User from "../../users/models/userModel.js";

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
    payer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
      onDelete: "CASCADE",
    },
    debtor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
      onDelete: "CASCADE",
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
        exclude: ["createdAt", "updatedAt", "deletedAt"],
      },
    },
  },
);

FriendExpense.belongsTo(User, {
  foreignKey: "payer_id",
  as: "payer",
});

FriendExpense.belongsTo(User, {
  foreignKey: "debtor_id",
  as: "debtor",
});

export default FriendExpense;
