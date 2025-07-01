'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change the email column to remove the unique constraint
    await queryInterface.changeColumn('users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add the unique constraint to the email column
    await queryInterface.changeColumn('users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  },
};
