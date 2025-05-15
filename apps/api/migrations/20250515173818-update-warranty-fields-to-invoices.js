"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      "invoices",
      "RoadHazardWarranty",
      "roadHazardWarranty"
    );
    await queryInterface.renameColumn(
      "invoices",
      "FlatRepairWarranty",
      "flatRepairWarranty"
    );
    await queryInterface.renameColumn(
      "invoices",
      "RotationWarranty",
      "rotationWarranty"
    );
    await queryInterface.renameColumn("invoices", "NoWarranty", "noWarranty");
    await queryInterface.renameColumn("invoices", "Balance", "balance");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      "invoices",
      "roadHazardWarranty",
      "RoadHazardWarranty"
    );
    await queryInterface.renameColumn(
      "invoices",
      "flatRepairWarranty",
      "FlatRepairWarranty"
    );
    await queryInterface.renameColumn(
      "invoices",
      "rotationWarranty",
      "RotationWarranty"
    );
    await queryInterface.renameColumn("invoices", "noWarranty", "NoWarranty");
    await queryInterface.renameColumn("invoices", "balance", "Balance");
  },
};
