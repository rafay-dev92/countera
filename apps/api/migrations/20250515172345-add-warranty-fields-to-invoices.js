"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("invoices", "paidAmount", {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("invoices", "manufactureWarranty", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("invoices", "RoadHazardWarranty", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("invoices", "FlatRepairWarranty", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("invoices", "RotationWarranty", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("invoices", "NoWarranty", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("invoices", "Balance", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("invoices", "paidAmount");
    await queryInterface.removeColumn("invoices", "manufactureWarranty");
    await queryInterface.removeColumn("invoices", "RoadHazardWarranty");
    await queryInterface.removeColumn("invoices", "FlatRepairWarranty");
    await queryInterface.removeColumn("invoices", "RotationWarranty");
    await queryInterface.removeColumn("invoices", "NoWarranty");
    await queryInterface.removeColumn("invoices", "Balance");
  },
};
