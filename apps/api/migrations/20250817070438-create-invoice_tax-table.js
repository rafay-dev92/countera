"use strict";

const { InvoiceTaxType } = require("@countera/shared");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("invoice_tax", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      InvoiceId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "invoices",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      ProductId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      TaxId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "taxes",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      tax_name: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "",
      },
      tax_rate: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      tax_type: {
        type: Sequelize.ENUM(InvoiceTaxType.Fixed, InvoiceTaxType.Percentage),
        allowNull: false,
        defaultValue: InvoiceTaxType.Percentage,
      },
      tax_amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("invoice_tax");
  },
};
