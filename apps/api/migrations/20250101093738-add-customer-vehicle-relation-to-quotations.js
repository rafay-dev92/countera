"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("quotations", "CustomerVehicleId", {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "customer_vehicles",
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("quotations", "CustomerVehicleId");
  },
};
