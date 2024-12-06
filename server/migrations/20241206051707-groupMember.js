/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("group_members", {
      "group_membership_id": {
        "type": Sequelize.UUID,
        "defaultValue": Sequelize.UUIDV4,
        "allowNull": false,
        "primaryKey": true
      },
      "group_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "groups", // Reference to the Groups table
          "key": "group_id" // The column in the Groups table
        }
      },
      "inviter_id": {
        "type": Sequelize.UUID,
        "allowNull": true,
        "references": {
          "model": "group_members", // Reference to the GroupMembers table (self-referencing)
          "key": "group_membership_id" // The column in the GroupMembers table
        }
      },
      "member_id": {
        "type": Sequelize.UUID,
        "allowNull": false,
        "references": {
          "model": "users", // Reference to the Users table
          "key": "user_id" // The column in the Users table
        }
      },
      "status": {
        "type": Sequelize.ENUM("PENDING", "ACCEPTED", "REJECTED"),
        "allowNull": false,
        "defaultValue": "PENDING"
      },
      "role": {
        "type": Sequelize.ENUM("CREATOR", "ADMIN", "COADMIN", "USER"),
        "allowNull": false,
        "defaultValue": "USER"
      },
      "has_archived": {
        "type": Sequelize.BOOLEAN,
        "allowNull": false,
        "defaultValue": false
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

    await queryInterface.addIndex("group_members", [ "group_id", "member_id" ], {
      "unique": true
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("group_members");
  }
};
