import { DataTypes } from "sequelize";

export default (sequelize) => {
  // Define the FriendMessage model
  const FriendMessage = sequelize.define(
    "friends_messages", // Table name in the database
    {
      "message_id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "conversation_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "sender_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "message": {
        "type": DataTypes.STRING(512),
        "allowNull": false
      },
      "is_read": {
        "type": DataTypes.BOOLEAN,
        "defaultValue": false,
        "allowNull": false
      }
    },
    {
      "timestamps": true,
      "paranoid": true,
      "defaultScope": {
        "attributes": {
          "exclude": [ "deletedAt" ] // Exclude the 'deletedAt' field from the default queries
        }
      }
    }
  );

  return FriendMessage;
};
