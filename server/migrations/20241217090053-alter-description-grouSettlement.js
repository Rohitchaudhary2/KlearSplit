/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change the description field to allow NULL
    await queryInterface.changeColumn("group_settlements", "description", {
      "type": Sequelize.STRING(150),
      "allowNull": true // Set allowNull to true
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert the description field back to NOT NULL if necessary
    await queryInterface.changeColumn("group_settlements", "description", {
      "type": Sequelize.STRING(150),
      "allowNull": false // Set allowNull back to false
    });
  }
};
