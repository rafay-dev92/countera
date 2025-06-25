'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('invoice_product', 'is_reminder_enabled');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('invoice_product', 'is_reminder_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  }
};
