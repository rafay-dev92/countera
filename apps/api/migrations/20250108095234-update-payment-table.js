"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("payments", "totalAmount", {
      type: Sequelize.FLOAT, // Changing to FLOAT
      allowNull: false,
    });

    // Changing paidAmount column type
    await queryInterface.changeColumn("payments", "paidAmount", {
      type: Sequelize.FLOAT, // Changing to FLOAT
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("payments", "totalAmount", {
      type: Sequelize.STRING, // Reverting to STRING
      allowNull: false,
    });

    // Reverting paidAmount column type to STRING
    await queryInterface.changeColumn("payments", "paidAmount", {
      type: Sequelize.STRING, // Reverting to STRING
      allowNull: false,
    });
  },
};
