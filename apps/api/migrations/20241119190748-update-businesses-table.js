"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("businesses", "location");

    // Add new columns to the 'businesses' table
    await queryInterface.addColumn("businesses", "logo", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("businesses", "licenseNumber", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("businesses", "permitNumber", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("businesses", "tel", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("businesses", "fax", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("businesses", "defaultMargin", {
      type: Sequelize.FLOAT,
      allowNull: true,
    });

    await queryInterface.addColumn("businesses", "address", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("businesses", "city", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("businesses", "state", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("businesses", "zipcode", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert the changes by adding back the 'location' column
    await queryInterface.addColumn('businesses', 'location', {
      type: Sequelize.STRING,
      allowNull: true, // Adjust this based on the previous definition
    });

    // Remove the columns added in the 'up' migration
    await queryInterface.removeColumn('businesses', 'logo');
    await queryInterface.removeColumn('businesses', 'licenseNumber');
    await queryInterface.removeColumn('businesses', 'permitNumber');
    await queryInterface.removeColumn('businesses', 'tel');
    await queryInterface.removeColumn('businesses', 'fax');
    await queryInterface.removeColumn('businesses', 'defaultMargin');
    await queryInterface.removeColumn('businesses', 'address');
    await queryInterface.removeColumn('businesses', 'city');
    await queryInterface.removeColumn('businesses', 'state');
    await queryInterface.removeColumn('businesses', 'zipcode');
  },
};
