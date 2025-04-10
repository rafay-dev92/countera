'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('inspections', 'name');
    await queryInterface.removeColumn('inspections', 'status');
    await queryInterface.removeColumn('inspections', 'detail');

    await queryInterface.addColumn('inspections', 'data', {
      type: Sequelize.JSON,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('inspections', 'data');

    await queryInterface.addColumn('inspections', 'name', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.addColumn('inspections', 'status', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.addColumn('inspections', 'detail', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
