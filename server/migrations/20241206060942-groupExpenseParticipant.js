/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("group_expense_participants", {
      "expense_participant_id": {
        "type": Sequelize.UUID,
        "defaultValue": Sequelize.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "group_expense_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "group_expenses", // Assuming you have a 'GroupExpenses' table
          "key": "group_expense_id" // The primary key of the GroupExpenses table
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
      "debtor_amount": {
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable("group_expense_participants");
  }
};
