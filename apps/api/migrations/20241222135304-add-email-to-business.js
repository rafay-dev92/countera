"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("businesses", "email", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("businesses", "email");
  },
};
