'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove BusinessId from users
    await queryInterface.removeColumn('users', 'BusinessId');
    // Create user_business join table
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
    // Add unique constraint on (UserId, BusinessId) - this is already handled by the composite primary key
    // No need for additional constraint since (UserId, BusinessId) is the primary key
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('user_business');
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
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'User'
    });
  }
}; 