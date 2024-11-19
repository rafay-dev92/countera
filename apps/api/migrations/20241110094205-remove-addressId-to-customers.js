'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('customers', 'AddressId');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('customers', 'AddressId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'addresses',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  }
};
