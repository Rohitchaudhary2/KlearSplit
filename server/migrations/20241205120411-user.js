/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      "user_id": {
        "type": Sequelize.UUID,
        "defaultValue": Sequelize.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "email": {
        "type": Sequelize.STRING(128),
        "allowNull": false,
        "unique": true,
        "validate": {
          "isEmail": true
        }
      },
      "first_name": {
        "type": Sequelize.STRING(50),
        "allowNull": false
      },
      "last_name": {
        "type": Sequelize.STRING(50),
        "allowNull": true
      },
      "password": {
        "type": Sequelize.STRING(100),
        "allowNull": false
      },
      "image_url": {
        "type": Sequelize.STRING(255),
        "allowNull": true
      },
      "phone": {
        "type": Sequelize.STRING(10),
        "allowNull": true
      },
      "notification_settings": {
        "type": Sequelize.JSONB,
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
        "type": Sequelize.BOOLEAN,
        "allowNull": false,
        "defaultValue": false
      },
      "is_invited": {
        "type": Sequelize.BOOLEAN,
        "allowNull": false,
        "defaultValue": false
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
    await queryInterface.dropTable("users");
  }
};
