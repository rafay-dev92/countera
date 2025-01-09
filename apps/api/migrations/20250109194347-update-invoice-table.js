'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeIndex('invoices', 'invoiceNumber');

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addIndex('invoices', ['invoiceNumber'], {
      unique: true,
      name: 'invoiceNumber',
  });
  }
};
