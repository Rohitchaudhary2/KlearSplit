/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("group_settlements", {
      "group_settlement_id": {
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
      "payer_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "group_members", // Assuming you have a 'Users' table
          "key": "group_membership_id" // The primary key of the Users table
        }
      },
      "debtor_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "group_members", // Assuming you have a 'Users' table
          "key": "group_membership_id" // The primary key of the Users table
        }
      },
      "settlement_amount": {
        "type": Sequelize.DECIMAL(12, 2), // Defines a DECIMAL field with 12 digits in total and 2 decimal places
        "allowNull": false
      },
      "description": {
        "type": Sequelize.STRING(150),
        "allowNull": false
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable("group_settlements");
  }
};
