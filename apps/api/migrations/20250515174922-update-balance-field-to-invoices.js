'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
        await queryInterface.renameColumn("invoices", "balance", "balanceWarranty");
  },

  async down (queryInterface, Sequelize) {
        await queryInterface.renameColumn("invoices", "balanceWarranty", "balance");
  }
};
