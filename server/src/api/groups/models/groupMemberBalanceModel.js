import { DataTypes } from "sequelize";

export default (sequelize) => {
  const GroupMemberBalance = sequelize.define(
    "group_member_balance",
    {
      "balance_id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "group_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "participant1_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "participant2_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "balance_amount": {
        "type": DataTypes.DECIMAL(12, 2),
        "allowNull": false,
        "defaultValue": 0
      }
    },
    {
      "tableName": "group_member_balance",
      "timestamps": true,
      "paranoid": true,
      "indexes": [
        // Define the composite unique index for group_id, participant1_id, and participant2_id
        {
          "unique": true,
          "fields": [
            "group_id",
            // Use a combination of LEAST and GREATEST to ensure order consistency
            sequelize.literal("LEAST(participant1_id, participant2_id)"),
            sequelize.literal("GREATEST(participant1_id, participant2_id)")
          ]
        }
      ]
    }
  );

  return GroupMemberBalance;
};
