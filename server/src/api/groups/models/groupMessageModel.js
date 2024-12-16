import { DataTypes } from "sequelize";

export default (sequelize) => {
  const GroupMessage = sequelize.define(
    "group_message",
    {
      "group_message_id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "sender_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "group_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "message": {
        "type": DataTypes.STRING(512),
        "allowNull": false
      }
    },
    {
      "timestamps": true,
      "paranoid": true
    }
  );

  return GroupMessage;
};
