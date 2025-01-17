import { DataTypes, Op } from "sequelize";
import { FriendExpense, FriendMessage } from "../../../config/db.connection.js";

export default (sequelize) => {
  // Define the Friend model
  const Friend = sequelize.define(
    "friends", // Table name in the database
    {
      "conversation_id": {
        "type": DataTypes.UUID,
        "defaultValue": DataTypes.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "friend1_id": {
        "type": DataTypes.UUID,
        "allowNull": false,
        "references": {
          "model": "users",
          "key": "user_id"
        }
      },
      "friend2_id": {
        "type": DataTypes.UUID,
        "allowNull": false,
        "references": {
          "model": "users",
          "key": "user_id"
        }
      },
      "status": {
        "type": DataTypes.ENUM("PENDING", "ACCEPTED", "REJECTED"), // Allowed status values
        "allowNull": false,
        "defaultValue": "PENDING"
      },
      "balance_amount": {
        "type": DataTypes.DECIMAL(12, 2),
        "allowNull": false,
        "defaultValue": 0
      },
      "archival_status": {
        "type": DataTypes.ENUM("NONE", "FRIEND1", "FRIEND2", "BOTH"), // Archive status options
        "allowNull": false,
        "defaultValue": "NONE"
      },
      "block_status": {
        "type": DataTypes.ENUM("NONE", "FRIEND1", "FRIEND2", "BOTH"), // Block status options
        "allowNull": false,
        "defaultValue": "NONE"
      }
    },
    {
      "timestamps": true,
      "paranoid": true, // Enables soft deletes by adding 'deletedAt' field
      // "defaultScope": {
      //   "attributes": {
      //     "exclude": [ "createdAt", "updatedAt", "deletedAt" ] // Exclude these fields in default queries
      //   }
      // },
      "scopes": {
        "withDeletedAt": {
          "attributes": {} // Include 'deletedAt' field in this scope
        }
      }
    }
  );

  // Hook to handle soft-deleting associated messages and expenses when a friend relationship is deleted
  Friend.beforeDestroy(async(conversation, options) => {
    const transaction = options.transaction;
    const conversationId = conversation.conversation_id;

    // Soft delete associated messages
    await FriendMessage.update(
      { "deletedAt": new Date() }, // Set 'deletedAt' timestamp
      {
        "where": {
          "conversation_id": conversationId
        },
        transaction
      }
    );

    // Soft deleted associated expenses
    await FriendExpense.update(
      { "deletedAt": new Date(), "is_deleted": 1 }, // Set 'deletedAt' and mark as deleted
      {
        "where": {
          [ Op.and ]: [ { "conversation_id": conversationId }, { "is_deleted": 0 } ]
        },
        transaction
      }
    );
  });

  // Hook to restore associated messages and expenses when a friend relationship is restored
  Friend.afterRestore(async(conversation, options) => {
    const transaction = options.transaction;
    const conversationId = conversation.conversation_id;

    // Restore associated messages
    await FriendMessage.update(
      { "deletedAt": null }, // Reset 'deletedAt' timestamp
      {
        "where": {
          "conversation_id": conversationId
        },
        transaction,
        "paranoid": false
      }
    );

    // Restore associated expenses
    await FriendExpense.update(
      { "deletedAt": null, "is_deleted": 0 }, // Clear the `deletedAt` field and mark as not deleted
      {
        "where": {
          [ Op.and ]: [ { "conversation_id": conversationId }, { "is_deleted": 1 } ]
        },
        transaction,
        "paranoid": false
      }
    );
  });

  return Friend;
};
