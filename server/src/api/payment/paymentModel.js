import { DataTypes } from "sequelize";

export default (sequelize) => {
  // Define the FriendExpense model
  const Payment = sequelize.define(
    "payment", // Table name in the database
    {
      "id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "payment_id": {
        "type": DataTypes.STRING(255),
        "allowNull": false
      },
      "transaction_id": {
        "type": DataTypes.STRING(255),
        "allowNull": true
      },
      "payment_status": {
        "type": DataTypes.ENUM("PENDING", "COMPLETED", "FAILED", "CANCELLED"),
        "allowNull": false,
        "defaultValue": "PENDING"
      },
      "payment_method": {
        "type": DataTypes.STRING(50),
        "allowNull": false
      },
      "amount": {
        "type": DataTypes.DECIMAL(12, 2),
        "allowNull": false
      },
      "payer_id": {
        "type": DataTypes.UUID,
        "allowNull": false,
        "references": {
          "model": "users",
          "key": "user_id"
        }
      },
      "payee_id": {
        "type": DataTypes.UUID,
        "allowNull": false,
        "references": {
          "model": "users",
          "key": "user_id"
        }
      },
      "friend_settlement_id": {
        "type": DataTypes.UUID,
        "allowNull": true,
        "references": {
          "model": "friends_expenses",
          "key": "friend_expense_id"
        }
      },
      "group_settlement_id": {
        "type": DataTypes.UUID,
        "allowNull": true,
        "references": {
          "model": "group_settlements",
          "key": "group_settlement_id"
        }
      },
      "paypal_payer_id": {
        "type": DataTypes.STRING(255),
        "allowNull": true
      }
    },
    {
      "timestamps": true,
      "updatedAt": false
    }
  );

  return Payment;
};
