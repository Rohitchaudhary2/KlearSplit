/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("group_expenses", {
      "group_expense_id": {
        "type": Sequelize.UUID,
        "defaultValue": Sequelize.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "expense_name": {
        "type": Sequelize.STRING(50),
        "allowNull": false,
        "validate": {
          "notEmpty": {
            "msg": "Expense name can't be empty."
          }
        }
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
      "total_amount": {
        "type": Sequelize.DECIMAL(12, 2), // Defines a DECIMAL field with 12 digits in total and 2 decimal places
        "allowNull": false,
        "defaultValue": 0
      },
      "description": {
        "type": Sequelize.STRING(50),
        "allowNull": true
      },
      "receipt_url": {
        "type": Sequelize.STRING(255),
        "allowNull": true
      },
      "split_type": {
        "type": Sequelize.ENUM("EQUAL", "UNEQUAL", "PERCENTAGE"),
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
    await queryInterface.dropTable("group_expenses");
  }
};
