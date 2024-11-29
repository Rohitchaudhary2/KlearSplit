import { DataTypes } from "sequelize";
import { ErrorHandler } from "../../middlewares/errorHandler.js";

export default (sequelize) => {
  // Define the FriendExpense model
  const FriendExpense = sequelize.define(
    "friends_expenses", // Table name in the database
    {
      "friend_expense_id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "expense_name": {
        "type": DataTypes.STRING(50),
        "allowNull": false,
        "validate": {
          "notEmpty": {
            "msg": "Expense name can't be empty."
          }
        }
      },
      "total_amount": {
        "type": DataTypes.DECIMAL(12, 2),
        "allowNull": false,
        "validate": {
          "notEmpty": {
            "msg": "Total amount can't be empty."
          },
          "isNumeric": {
            "msg": "Total amount must be a number."
          }
        }
      },
      "description": {
        "type": DataTypes.STRING(150),
        "allowNull": true
      },
      "conversation_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "payer_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "debtor_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "split_type": {
        "type": DataTypes.ENUM("EQUAL", "UNEQUAL", "PERCENTAGE", "SETTLEMENT"),
        "allowNull": false,
        "defaultValue": "EQUAL"
      },
      "debtor_amount": {
        "type": DataTypes.DECIMAL(12, 2),
        "allowNull": false
      },
      "receipt_url": {
        "type": DataTypes.STRING(255),
        "allowNull": true
      },
      "is_deleted": {
        "type": DataTypes.SMALLINT,
        "allowNull": false,
        "defaultValue": 0,
        "validate": {
          isInRange(value) {
            if (![ 0, 1, 2 ].includes(value)) {
              throw new ErrorHandler("is_deleted value must be 0, 1, or 2");
            }
          }
        },
        "comment": "0 = Not deleted, 1 = Deleted by system, 2 = Deleted by user"
      }
    },
    {
      "timestamps": true,
      "paranoid": true,
      "defaultScope": {
        "attributes": {
          "exclude": [ "deletedAt" ]
        }
      }
    }
  );

  return FriendExpense;
};
