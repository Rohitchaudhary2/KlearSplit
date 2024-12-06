/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("group_messages", {
      "group_message_id": {
        "type": Sequelize.UUID,
        "defaultValue": Sequelize.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "sender_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "group_members", // The table name where sender is stored (assuming Users table exists)
          "key": "group_membership_id" // Primary key of the Users table
        }
      },
      "group_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "groups", // The table name for groups
          "key": "group_id" // Primary key of the Groups table
        }
      },
      "message": {
        "type": Sequelize.STRING(512),
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
    await queryInterface.dropTable("group_messagges");
  }
};
