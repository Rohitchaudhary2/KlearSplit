/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("friends_expenses", {
      "friend_expense_id": {
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
      "total_amount": {
        "type": Sequelize.DECIMAL(12, 2),
        "allowNull": false,
        "validate": {
          "notEmpty": {
            "msg": "Total amount can't be empty."
          },
          "isNumeric": {
            "msg": "Total amount must be a number."
          }
        }
      },
      "description": {
        "type": Sequelize.STRING(150),
        "allowNull": true
      },
      "conversation_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "friends",
          "key": "conversation_id"
        }
      },
      "payer_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "users",
          "key": "user_id"
        }
      },
      "debtor_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "users",
          "key": "user_id"
        }
      },
      "split_type": {
        "type": Sequelize.ENUM("EQUAL", "UNEQUAL", "PERCENTAGE", "SETTLEMENT"),
        "allowNull": false,
        "defaultValue": "EQUAL"
      },
      "debtor_amount": {
        "type": Sequelize.DECIMAL(12, 2),
        "allowNull": false
      },
      "receipt_url": {
        "type": Sequelize.STRING(255),
        "allowNull": true
      },
      "is_deleted": {
        "type": Sequelize.SMALLINT,
        "allowNull": false,
        "defaultValue": 0,
        "validate": {
          isInRange(value) {
            if (![ 0, 1, 2 ].includes(value)) {
              throw new Error("is_deleted value must be 0, 1, or 2");
            }
          }
        },
        "comment": "0 = Not deleted, 1 = Deleted by system, 2 = Deleted by user"
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
    await queryInterface.dropTable("friends_expenses");
  }
};
