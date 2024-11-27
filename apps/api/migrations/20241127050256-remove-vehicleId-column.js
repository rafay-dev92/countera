"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // updating some invoice's columns
    await queryInterface.changeColumn("invoices", "odometer", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.changeColumn("invoices", "licenseNo", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Remove the 'VehicleId' column from the specified tables
    const tables = ["invoices", "quotations", "workorders"];

    for (const table of tables) {
      await queryInterface.removeColumn(table, "VehicleId");
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = ["invoices", "quotations", "work_orders"];

    for (const table of tables) {
      await queryInterface.addColumn(table, "VehicleId", {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "vehicles",
          key: "id",
        },
        onDelete: "SET NULL", // Adjust to your original constraint behavior
        onUpdate: "CASCADE",
      });
    }
  },
};
