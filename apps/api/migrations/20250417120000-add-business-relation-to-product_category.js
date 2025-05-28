'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('product_categories', 'BusinessId', {
        type: Sequelize.UUID,
        allowNull: true,
      });
  
      await queryInterface.sequelize.query(`
        UPDATE product_categories
        SET "BusinessId" = 'ed91be50-8e01-11ef-b4f7-025d98e2c1ed'
        WHERE "BusinessId" IS NULL
      `);
  
      await queryInterface.changeColumn('product_categories', 'BusinessId', {
        type: Sequelize.UUID,
        allowNull: false,
      });
  
      await queryInterface.addConstraint('product_categories', {
        fields: ['BusinessId'],
        type: 'foreign key',
        name: 'fk_product_categories_business',
        references: {
          table: 'businesses',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });
  },

  async down(queryInterface, Sequelize) {
     await queryInterface.removeConstraint('product_categories', 'fk_product_categories_business');
     await queryInterface.removeColumn('product_categories', 'BusinessId');
  },
}; 