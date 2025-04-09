'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Promise.all([
      // Remove 'products' column if exists
      queryInterface.removeColumn('workorders', 'products').catch(() => {}),

      // Add new columns
      queryInterface.addColumn('workorders', 'workOrderNumber', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      }),
      queryInterface.addColumn('workorders', 'totalAmount', {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      }),
      queryInterface.addColumn('workorders', 'status', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Pending',
      }),
      queryInterface.addColumn('workorders', 'notes', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('workorders', 'comments', {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn('workorders', 'CustomerVehicleId', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customer_vehicles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      }),
      queryInterface.addColumn('workorders', 'BusinessId', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'businesses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      }),
    ]);

    // 2. Create junction table
    await queryInterface.createTable('workorder_product', {
      WorkOrderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'workorders',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        primaryKey: true,
      },
      ProductId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        primaryKey: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down (queryInterface, Sequelize) {
    // Undo everything
    await Promise.all([
      queryInterface.addColumn('workorders', 'products', {
        type: Sequelize.JSON, // guessing original type
        allowNull: true,
      }),

      queryInterface.removeColumn('workorders', 'workOrderNumber'),
      queryInterface.removeColumn('workorders', 'totalAmount'),
      queryInterface.removeColumn('workorders', 'status'),
      queryInterface.removeColumn('workorders', 'notes'),
      queryInterface.removeColumn('workorders', 'comments'),
      queryInterface.removeColumn('workorders', 'CustomerVehicleId'),
      queryInterface.removeColumn('workorders', 'BusinessId'),
    ]);

    await queryInterface.dropTable('workorder_product');
  }
};
