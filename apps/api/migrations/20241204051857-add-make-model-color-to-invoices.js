"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("invoices", "make", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addColumn("invoices", "model", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addColumn("invoices", "color", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("invoices", "make");
    await queryInterface.removeColumn("invoices", "model");
    await queryInterface.removeColumn("invoices", "color");
  },
};
