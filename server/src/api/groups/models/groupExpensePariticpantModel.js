import { DataTypes } from "sequelize";

export default (sequelize) => {
  const GroupExpenseParticipant = sequelize.define(
    "group_expense_participant",
    {
      "expense_participant_id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "group_expense_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "debtor_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "debtor_amount": {
        "type": DataTypes.DECIMAL(12, 2),
        "allowNull": false,
        "defaultValue": 0
      }
    },
    {
      "timestamps": true,
      "paranoid": true,
      "indexes": [
        {
          "unique": true,
          "fields": [ "group_expense_id", "debtor_id" ]
        }
      ]
    }
  );

  return GroupExpenseParticipant;
};
