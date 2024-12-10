/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the 'has_blocked' column to the 'group_members' table
    await queryInterface.addColumn("group_members", "has_blocked", {
      "type": Sequelize.BOOLEAN,
      "allowNull": false,
      "defaultValue": false
    });
  },

  async down(queryInterface) {
    // Revert the migration (remove the 'has_blocked' column)
    await queryInterface.removeColumn("group_members", "has_blocked");
  }
};
