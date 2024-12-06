/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("group_member_balance", {
      "balance_id": {
        "type": Sequelize.UUID,
        "defaultValue": Sequelize.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "group_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "groups", // Assuming you have a 'Groups' table
          "key": "group_id" // The primary key of the Groups table
        }
      },
      "participant1_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "group_members", // Assuming you have a 'Users' table
          "key": "group_membership_id" // The primary key of the Users table
        }
      },
      "participant2_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "group_members", // Assuming you have a 'Users' table
          "key": "group_membership_id" // The primary key of the Users table
        }
      },
      "balance_amount": {
        "type": Sequelize.DECIMAL(12, 2), // Defines a DECIMAL field with 12 digits in total and 2 decimal places
        "allowNull": false,
        "defaultValue": 0 // The default value is 0
      },
      "createdAt": {
        "type": Sequelize.DATE,
        "allowNull": false,
        "defaultValue": Sequelize.NOW // Default to current timestamp
      },
      "updatedAt": {
        "type": Sequelize.DATE,
        "allowNull": false,
        "defaultValue": Sequelize.NOW // Default to current timestamp
      },
      "deletedAt": {
        "type": Sequelize.DATE,
        "allowNull": true,
        "defaultValue": null
      }
    });

    await queryInterface.addIndex(
      "group_member_balance",
      [
        "group_id",
        Sequelize.literal("LEAST(participant1_id, participant2_id)"),
        Sequelize.literal("GREATEST(participant1_id, participant2_id)")
      ],
      { "unique": true }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("group_member_balance");
  }
};
