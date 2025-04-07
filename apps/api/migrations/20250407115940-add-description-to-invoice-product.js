'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('invoice_product', 'description', {
      type: Sequelize.STRING,
      defaultValue: '',
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('invoice_product', 'description');
  }
};
