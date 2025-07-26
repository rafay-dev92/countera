"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("archived_invoices", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      originalInvoiceId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      invoiceNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      totalAmount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      discount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      paymentStatus: {
        type: Sequelize.ENUM(
          "UNPAID",
          "PARTIALLY_PAID",
          "PAID",
          "REFUNDED",
          "VOID"
        ),
        allowNull: false,
        defaultValue: "UNPAID",
      },
      paidAmount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      comments: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      manufactureWarranty: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      roadHazardWarranty: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      flatRepairWarranty: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      rotationWarranty: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      noWarranty: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      balanceWarranty: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      payments: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      CustomerId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      CustomerVehicleId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      BusinessId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add foreign key constraints
    await queryInterface.addConstraint("archived_invoices", {
      fields: ["CustomerId"],
      type: "foreign key",
      name: "fk_invoice_customer",
      references: {
        table: "customers",
        field: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("archived_invoices", {
      fields: ["CustomerVehicleId"],
      type: "foreign key",
      name: "fk_invoice_customer_vehicle",
      references: {
        table: "customer_vehicles",
        field: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });

    await queryInterface.addConstraint("archived_invoices", {
      fields: ["BusinessId"],
      type: "foreign key",
      name: "fk_invoice_business",
      references: {
        table: "businesses",
        field: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });

    // create archived invoice & products junction table
    await queryInterface.createTable("archived_invoice_product", {
      ArchivedInvoiceId: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "archived_invoices",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      ProductId: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "products",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "",
      },
      price: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      replacement_reminder_date: { type: Sequelize.DATE, allowNull: true },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("archived_invoices");
    await queryInterface.dropTable("archived_invoice_product");
  },
};
