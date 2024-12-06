/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("groups", {
      "group_id": {
        "type": Sequelize.UUID,
        "defaultValue": Sequelize.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "group_name": {
        "type": Sequelize.STRING(100),
        "allowNull": false,
        "validate": {
          "notEmpty": {
            "msg": "Group name can't be empty."
          }
        }
      },
      "group_description": {
        "type": Sequelize.STRING(255),
        "allowNull": true
      },
      "creator_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "users",
          "key": "user_id"
        }
      },
      "image_url": {
        "type": Sequelize.STRING(255),
        "allowNull": true
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
    await queryInterface.dropTable("groups");
  }
};
