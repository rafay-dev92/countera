'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('invoices', 'CustomerVehicleId', {
      type: Sequelize.UUID,
      allowNull: true, // Initially, set to allow null to avoid issues with existing records
      references: {
        model: 'customer_vehicles', // Name of the related table
        key: 'id',                 // Key in the related table
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // Set to null if the related vehicle is deleted
    });

    // Remove the fields from the invoices table
    await queryInterface.removeColumn('invoices', 'licenseNo');
    await queryInterface.removeColumn('invoices', 'odometer');
    await queryInterface.removeColumn('invoices', 'make');
    await queryInterface.removeColumn('invoices', 'model');
    await queryInterface.removeColumn('invoices', 'year');
    await queryInterface.removeColumn('invoices', 'color');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('invoices', 'CustomerVehicleId');

    await queryInterface.addColumn('invoices', 'licenseNo', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('invoices', 'odometer', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('invoices', 'make', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('invoices', 'model', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('invoices', 'year', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('invoices', 'color', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};
