'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add description and price to quotation_product table
    await queryInterface.addColumn('quotation_product', 'description', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: ''
    });

    await queryInterface.addColumn('quotation_product', 'price', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0
    });

    // Add description and price to workorder_product table
    await queryInterface.addColumn('workorder_product', 'description', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: ''
    });

    await queryInterface.addColumn('workorder_product', 'price', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns from quotation_product table
    await queryInterface.removeColumn('quotation_product', 'description');
    await queryInterface.removeColumn('quotation_product', 'price');

    // Remove columns from workorder_product table
    await queryInterface.removeColumn('workorder_product', 'description');
    await queryInterface.removeColumn('workorder_product', 'price');
  }
}; 