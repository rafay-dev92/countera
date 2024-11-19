'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('addresses', 'Customerid', 'CustomerId');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('addresses', 'CustomerId', 'Customerid');
  }
};
