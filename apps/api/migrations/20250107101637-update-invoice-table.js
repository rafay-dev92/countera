"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("invoices", "paymentMethod", {
      type: Sequelize.STRING, // Ensure the type matches the original type
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("invoices", "paymentMethod", {
      type: Sequelize.STRING, // Ensure the type matches the original type
      allowNull: false, // Revert the change
    });
  },
};
