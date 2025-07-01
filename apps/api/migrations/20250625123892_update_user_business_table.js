'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {    
    // Remove role from users table if it exists
    try {
      await queryInterface.removeColumn('users', 'role');
    } catch (error) {
      // Column might not exist, ignore error
      console.log('role column might not exist in users table');
    }
    
    // Add role column to user_business table
    await queryInterface.addColumn('user_business', 'role', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'User'
    });

    // Add isSuperAdmin column to users table
    await queryInterface.addColumn('users', 'isSuperAdmin', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove role from user_business table
    await queryInterface.removeColumn('user_business', 'role');
    
    // Add role back to users table
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'User'
    });

    // Remove isSuperAdmin column from users table
    await queryInterface.removeColumn('users', 'isSuperAdmin');
  }
}; 