/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("friends", {
      "conversation_id": {
        "type": Sequelize.UUID,
        "defaultValue": Sequelize.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "friend1_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "users", // Referencing 'users' table
          "key": "user_id"
        }
      },
      "friend2_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "users", // Referencing 'users' table
          "key": "user_id"
        }
      },
      "status": {
        "type": Sequelize.ENUM("PENDING", "ACCEPTED", "REJECTED"),
        "allowNull": false,
        "defaultValue": "PENDING"
      },
      "balance_amount": {
        "type": Sequelize.DECIMAL(12, 2),
        "allowNull": false,
        "defaultValue": 0
      },
      "archival_status": {
        "type": Sequelize.ENUM("NONE", "FRIEND1", "FRIEND2", "BOTH"),
        "allowNull": false,
        "defaultValue": "NONE"
      },
      "block_status": {
        "type": Sequelize.ENUM("NONE", "FRIEND1", "FRIEND2", "BOTH"),
        "allowNull": false,
        "defaultValue": "NONE"
      },
      "createdAt": {
        "type": Sequelize.DATE,
        "allowNull": false,
        "defaultValue": Sequelize.NOW // Automatically sets current timestamp
      },
      "updatedAt": {
        "type": Sequelize.DATE,
        "allowNull": false,
        "defaultValue": Sequelize.NOW // Automatically sets current timestamp
      },
      "deletedAt": {
        "type": Sequelize.DATE,
        "allowNull": true,
        "defaultValue": null // Will be null initially, set during soft delete
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("friends");
  }
};
