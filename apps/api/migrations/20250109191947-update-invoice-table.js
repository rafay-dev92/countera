"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("invoices", "realInvoiceId");
    await queryInterface.removeColumn("invoices", "paymentMethod");
    await queryInterface.removeColumn("invoices", "current");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("invoices", "realInvoiceId", {
      type: Sequelize.UUID,
      allowNull: true, // Allow null values since it is self-referential
      references: {
        model: "invoices", // References the same table
        key: "id",
      },
      onUpdate: "CASCADE", // Automatically update when the related invoice changes
      onDelete: "SET NULL", // Set null when the related invoice is deleted
    });
    await queryInterface.addColumn("invoices", "paymentMethod", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("invoices", "current", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    });
  },
};
