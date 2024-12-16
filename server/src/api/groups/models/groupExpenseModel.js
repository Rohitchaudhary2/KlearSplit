import { DataTypes } from "sequelize";

export default (sequelize) => {
  const GroupExpense = sequelize.define(
    "group_expense",
    {
      "group_expense_id": {
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
      "group_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "payer_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "total_amount": {
        "type": DataTypes.DECIMAL(12, 2),
        "allowNull": false,
        "defaultValue": 0
      },
      "description": {
        "type": DataTypes.STRING(50),
        "allowNull": true
      },
      "receipt_url": {
        "type": DataTypes.STRING(255),
        "allowNull": true
      },
      "split_type": {
        "type": DataTypes.ENUM("EQUAL", "UNEQUAL", "PERCENTAGE"),
        "allowNull": false
      }
    },
    {
      "timestamps": true,
      "paranoid": true
    }
  );

  return GroupExpense;
};
