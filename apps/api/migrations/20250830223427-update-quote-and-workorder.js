'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.addColumn('quotations', 'appliedTaxes', {
      type: Sequelize.JSON,
      allowNull: true,
    });

    queryInterface.addColumn('workorders', 'appliedTaxes', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    queryInterface.removeColumn('quotations', 'appliedTaxes');
    queryInterface.removeColumn('workorders', 'appliedTaxes');
  }
};
