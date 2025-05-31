'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('invoice_audits', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      invoiceId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'invoices',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fieldName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      oldValue: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      newValue: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      changeType: {
        type: Sequelize.ENUM(
          'UPDATE',           // Single field update
          'ADD',             // Single field addition
          'REMOVE',          // Single field removal
          'UPDATE_ADD',      // Field updated and new field added
          'UPDATE_REMOVE',   // Field updated and another field removed
          'ADD_REMOVE',      // New field added and another field removed
          'MULTIPLE'         // Multiple types of changes
        ),
        allowNull: false
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add only essential indexes
    await queryInterface.addIndex('invoice_audits', ['invoiceId']);
    await queryInterface.addIndex('invoice_audits', ['userId']);
    await queryInterface.addIndex('invoice_audits', ['timestamp']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('invoice_audits', ['invoiceId']);
    await queryInterface.removeIndex('invoice_audits', ['userId']);
    await queryInterface.removeIndex('invoice_audits', ['timestamp']);

    // Drop the table
    await queryInterface.dropTable('invoice_audits');
  }
}; 