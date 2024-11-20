import { DataTypes, Op } from "sequelize";

import { Friend, FriendExpense } from "../../../config/db.connection.js";

export default (sequelize) => {
  const User = sequelize.define(
    "user",
    {
      "user_id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "email": {
        "type": DataTypes.STRING(128),
        "allowNull": false,
        "unique": true,
        "validate": {
          "isEmail": {
            "args": true,
            "msg": "Please enter a valid email address"
          }
        }
      },
      "first_name": {
        "type": DataTypes.STRING(50),
        "allowNull": false,
        "validate": {
          "notEmpty": {
            "msg": "First name can't be empty."
          }
        }
      },
      "last_name": {
        "type": DataTypes.STRING(50),
        "allowNull": true
      },
      "password": {
        "type": DataTypes.STRING(100),
        "allowNull": false
      },
      "image_url": {
        "type": DataTypes.STRING(255),
        "allowNull": true
      },
      "phone": {
        "type": DataTypes.STRING(10),
        "allowNull": true
      },
      "notification_settings": {
        "type": DataTypes.JSONB,
        "allowNull": false,
        "defaultValue": {
          "friend_request_notifications": true,
          "friend_expense_notifications": true,
          "friend_settlement_notifications": true,
          "group_invitation_notifications": true,
          "group_expense_notifications": true,
          "group_settlement_notifications": true
        }
      },
      "is_admin": {
        "type": DataTypes.BOOLEAN,
        "allowNull": false,
        "defaultValue": false
      },
      "is_invited": {
        "type": DataTypes.BOOLEAN,
        "allowNull": false,
        "defaultValue": false
      }
    },
    {
      "timestamps": true,
      "paranoid": true,
      "defaultScope": {
        "attributes": {
          "exclude": [
            "password",
            "createdAt",
            "updatedAt",
            "deletedAt",
            "is_admin",
            "notification_settings"
          ]
        }
      },
      "scopes": {
        "withPassword": {
          "attributes": {}
        }
      }
    }
  );

  User.beforeDestroy(async(user, options) => {
    const transaction = options.transaction;
    const userId = user.user_id;

    // Soft delete friends where the user is either friend1 or friend2
    await Friend.update(
      { "deletedAt": new Date() },
      {
        "where": {
          [ Op.and ]: [
            { "status": { [ Op.ne ]: "REJECTED" } },
            { [ Op.or ]: [ { "friend1_id": userId }, { "friend2_id": userId } ] }
          ]
        },
        transaction
      }
    );
    await FriendExpense.update(
      { "deletedAt": new Date() },
      {
        "where": {
          [ Op.or ]: [ { "payer_id": userId }, { "debtor_id": userId } ]
        },
        transaction
      }
    );
  });

  User.afterRestore(async(user, options) => {
    const transaction = options.transaction;
    const userId = user.user_id;

    // Soft delete friends where the user is either friend1 or friend2
    await Friend.update(
      { "deletedAt": null },
      {
        "where": {
          [ Op.and ]: [
            { "status": { [ Op.ne ]: "REJECTED" } },
            { [ Op.or ]: [ { "friend1_id": userId }, { "friend2_id": userId } ] }
          ]
        },
        transaction,
        "paranoid": false
      }
    );
    await FriendExpense.update(
      { "deletedAt": null },
      {
        "where": {
          [ Op.or ]: [ { "payer_id": userId }, { "debtor_id": userId } ]
        },
        transaction,
        "paranoid": false
      }
    );
  });

  return User;
};
