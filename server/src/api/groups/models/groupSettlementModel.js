import { DataTypes } from "sequelize";

export default (sequelize) => {
  const GroupSettlement = sequelize.define(
    "group_settlement",
    {
      "group_settlement_id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "group_id": {
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
      "settlement_amount": {
        "type": DataTypes.DECIMAL(12, 2),
        "allowNull": false
      },
      "description": {
        "type": DataTypes.STRING(150),
        "allowNull": true
      }
    },
    {
      "timestamps": true,
      "paranoid": true
    }
  );

  return GroupSettlement;
};
