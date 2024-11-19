'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('addresses', 'CustomerId', {
      type: Sequelize.UUID, // Ensure this matches the type in the Customer table
      allowNull: false,
    });

     // Add foreign key constraint with ON DELETE CASCADE
     await queryInterface.addConstraint('addresses', {
      fields: ['CustomerId'],
      type: 'foreign key',
      name: 'fk_customer_address', // Custom name for the constraint
      references: {
        table: 'customers',
        field: 'id',
      },
      onDelete: 'CASCADE',
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove the foreign key constraint
    await queryInterface.removeConstraint('addresses', 'fk_customer_address');

    // Revert column change if necessary
    await queryInterface.changeColumn('addresses', 'CustomerId', {
      type: Sequelize.UUID, // Or original type if applicable
      allowNull: false, // Or original property if applicable
    });
  }
};
