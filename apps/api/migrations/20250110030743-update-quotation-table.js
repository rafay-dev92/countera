'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('quotations', 'approved', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    })
    await queryInterface.addColumn('quotations', 'quotationNumber', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('quotations', 'approved')
    await queryInterface.removeColumn('quotations', 'quotationNumber')
  }
};
