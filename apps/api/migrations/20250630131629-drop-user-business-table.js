'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Drop the user_business table
    await queryInterface.dropTable('user_business');

    // remove isSuperAdmin from users table
    await queryInterface.removeColumn('users', 'isSuperAdmin');

    // Add role column to users table
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'User'
    });

    // Add BusinessId column to users table
    await queryInterface.addColumn('users', 'BusinessId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'businesses',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  },

  async down (queryInterface, Sequelize) {
    // Re-create the user_business table
    await queryInterface.createTable('user_business', {
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      UserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        primaryKey: true
      },
      BusinessId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'businesses',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        primaryKey: true
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'User'
      }
    });
    
    // Add isSuperAdmin column in users table 
    await queryInterface.addColumn('users', 'isSuperAdmin', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });

    // Remove role column from users table
    await queryInterface.removeColumn('users', 'role');
    
    // Remove BusinessId column from users table
    await queryInterface.removeColumn('users', 'BusinessId');
  }
};
