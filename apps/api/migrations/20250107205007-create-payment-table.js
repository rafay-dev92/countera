"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("payments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      totalAmount: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      paidAmount: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cardNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      InvoiceId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "invoices", // name of the target table
          key: "id", // key in the target table that is being referenced
        },
        onDelete: "CASCADE", // cascading delete
        onUpdate: "CASCADE", // cascading updates
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("payments");
  },
};
