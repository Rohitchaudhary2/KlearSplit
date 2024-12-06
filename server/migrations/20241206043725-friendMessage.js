/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("friends_messages", {
      "message_id": {
        "type": Sequelize.UUID,
        "defaultValue": Sequelize.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "conversation_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "friends",
          "key": "conversation_id"
        }
      },
      "sender_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "users",
          "key": "user_id"
        }
      },
      "message": {
        "type": Sequelize.STRING(512),
        "allowNull": false
      },
      "is_read": {
        "type": Sequelize.BOOLEAN,
        "defaultValue": false,
        "allowNull": false
      },
      "createdAt": {
        "type": Sequelize.DATE,
        "allowNull": false,
        "defaultValue": Sequelize.NOW
      },
      "updatedAt": {
        "type": Sequelize.DATE,
        "allowNull": false,
        "defaultValue": Sequelize.NOW
      },
      "deletedAt": {
        "type": Sequelize.DATE,
        "allowNull": true,
        "defaultValue": null
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("friends_messages");
  }
};
