import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Group = sequelize.define(
    "group",
    {
      "group_id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "group_name": {
        "type": DataTypes.STRING(100),
        "allowNull": false,
        "validate": {
          "notEmpty": {
            "msg": "Group name can't be empty."
          }
        }
      },
      "group_description": {
        "type": DataTypes.STRING(255),
        "allowNull": true
      },
      "creator_id": {
        "type": DataTypes.UUID,
        "allowNull": false
      },
      "image_url": {
        "type": DataTypes.STRING(255),
        "allowNull": true
      }
    },
    {
      "timestamps": true,
      "paranoid": true
    }
  );

  return Group;
};
