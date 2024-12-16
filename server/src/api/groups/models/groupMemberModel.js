import { DataTypes } from "sequelize";

export default (sequelize) => {
  const GroupMember = sequelize.define(
    "group_member",
    {
      "group_membership_id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "group_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "inviter_id": {
        "type": DataTypes.UUID,
        "allowNull": true
      },
      "member_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "status": {
        "type": DataTypes.ENUM("PENDING", "ACCEPTED", "REJECTED"),
        "allowNull": false,
        "defaultValue": "PENDING"
      },
      "role": {
        "type": DataTypes.ENUM("CREATOR", "ADMIN", "COADMIN", "USER"),
        "allowNull": false,
        "defaultValue": "USER"
      },
      "has_archived": {
        "type": DataTypes.BOOLEAN,
        "allowNull": false,
        "defaultValue": false
      },
      "has_blocked": {
        "type": DataTypes.BOOLEAN,
        "allowNull": false,
        "defaultValue": false
      }
    },
    {
      "timestamps": true,
      "paranoid": true,
      "indexes": [
        {
          "unique": true,
          "fields": [ "group_id", "member_id" ]
        }
      ]
    }
  );

  return GroupMember;
};
