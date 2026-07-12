"use strict";

const { InvoicePaymentStatus } = require("@invoicify/shared");
const { UserRole } = require("@invoicify/shared");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const {
      UUID,
      UUIDV4,
      STRING,
      INTEGER,
      BOOLEAN,
      DATE,
      DATEONLY,
      FLOAT,
      TEXT,
      JSON,
      ENUM,
    } = Sequelize;

    await queryInterface.createTable("businesses", {
      id: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: UUIDV4,
      },
      name: { type: STRING, allowNull: false },
      email: { type: STRING, allowNull: true },
      logo: { type: STRING, allowNull: true },
      address: { type: STRING, allowNull: false },
      city: { type: STRING, allowNull: false },
      state: { type: STRING, allowNull: false },
      zipcode: { type: INTEGER, allowNull: false },
      timezone: { type: STRING, allowNull: true },
      licenseNumber: { type: STRING, allowNull: true },
      permitNumber: { type: STRING, allowNull: true },
      tel: { type: STRING, allowNull: false },
      fax: { type: STRING, allowNull: true },
      defaultMargin: { type: FLOAT, allowNull: true },
      termsAndConditions: { type: TEXT, allowNull: true },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("customers", {
      id: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: UUIDV4,
      },
      firstName: { type: STRING, allowNull: false },
      lastName: { type: STRING, allowNull: false },
      customerType: { type: STRING, allowNull: false },
      email: { type: STRING, allowNull: true },
      phone: { type: STRING, allowNull: true },
      licenseNo: { type: STRING, allowNull: true },
      notes: { type: TEXT, allowNull: true },
      taxable: { type: BOOLEAN, allowNull: false },
      isActive: { type: BOOLEAN, allowNull: false, defaultValue: true },
      BusinessId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "businesses",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("addresses", {
      id: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: UUIDV4,
      },
      street: { type: STRING, allowNull: true },
      city: { type: STRING, allowNull: true },
      state: { type: STRING, allowNull: true },
      zipcode: { type: INTEGER, allowNull: true },
      CustomerId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("appointments", {
      id: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: UUIDV4,
      },
      customerName: { type: STRING, allowNull: false },
      customerEmail: { type: STRING, allowNull: true },
      description: { type: STRING, allowNull: true },
      startDateTime: { type: DATE, allowNull: false },
      endDateTime: { type: DATE, allowNull: false },
      sendEmail: { type: BOOLEAN, allowNull: false },
      BusinessId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "businesses",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("customer_vehicles", {
      id: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: UUIDV4,
      },
      make: { type: STRING, allowNull: false },
      model: { type: STRING, allowNull: false },
      year: { type: INTEGER, allowNull: false },
      odometer: { type: INTEGER, allowNull: false },
      engineSize: { type: STRING, allowNull: true },
      licenseNo: { type: STRING, allowNull: true },
      vinNo: { type: STRING, allowNull: true },
      color: { type: STRING, allowNull: true },
      notes: { type: TEXT, allowNull: true },
      CustomerId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("invoices", {
      id: {
        type: UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      invoiceNumber: {
        type: INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      totalAmount: {
        type: FLOAT,
        allowNull: false,
      },
      discount: {
        type: FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      paymentStatus: {
        type: ENUM(
          InvoicePaymentStatus.PAID,
          InvoicePaymentStatus.PARTIALLY_PAID,
          InvoicePaymentStatus.UNPAID,
          InvoicePaymentStatus.VOIDED,
          InvoicePaymentStatus.REFUNDED
        ),
        allowNull: false,
        defaultValue: InvoicePaymentStatus.UNPAID,
      },
      paidAmount: {
        type: FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      isArchived: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notes: {
        type: STRING,
        allowNull: true,
      },
      comments: {
        type: STRING,
        allowNull: true,
      },
      manufactureWarranty: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      roadHazardWarranty: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      flatRepairWarranty: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      rotationWarranty: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      noWarranty: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      balanceWarranty: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      CustomerId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      },
      CustomerVehicleId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "customer_vehicles",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      },
      BusinessId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "businesses",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("quotations", {
      id: {
        type: UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      quotationNumber: {
        type: INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      totalAmount: {
        type: FLOAT,
        allowNull: false,
      },
      discount: {
        type: FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      approved: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notes: STRING,
      comments: STRING,
      CustomerId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      },
      CustomerVehicleId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "customer_vehicles",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      },
      BusinessId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "businesses",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("workorders", {
      id: {
        type: UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      workOrderNumber: {
        type: INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      totalAmount: {
        type: FLOAT,
        allowNull: false,
      },
      discount: {
        type: FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: ENUM("PENDING", "FINISHED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      notes: STRING,
      comments: STRING,
      CustomerId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      },
      CustomerVehicleId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "customer_vehicles",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      },
      BusinessId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "businesses",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("product_categories", {
      id: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: UUIDV4,
      },
      name: { type: STRING, allowNull: false },
      description: STRING,
      BusinessId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "businesses",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("products", {
      id: {
        type: UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: UUIDV4,
      },
      name: {
        type: STRING,
        allowNull: false,
      },
      image: STRING,
      margin: FLOAT,
      price: {
        type: FLOAT,
        allowNull: false,
      },
      description: STRING,
      cost: FLOAT,
      itemCode: STRING,
      type: {
        type: STRING,
        allowNull: false,
      },
      taxable: {
        type: BOOLEAN,
        allowNull: false,
      },
      BusinessId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "businesses",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      CategoryId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "product_categories",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("taxes", {
      id: {
        type: UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: STRING,
        allowNull: false,
      },
      type: {
        type: STRING,
        allowNull: false,
      },
      rate: {
        type: FLOAT,
        allowNull: false,
      },
      default: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      BusinessId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "businesses",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("users", {
      id: {
        type: UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      first_name: {
        type: STRING,
        allowNull: false,
      },
      last_name: {
        type: STRING,
        allowNull: false,
      },
      email: {
        type: STRING,
        allowNull: false,
      },
      password: {
        type: STRING,
        allowNull: false,
      },
      role: {
        type: ENUM(
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.USER,
          UserRole.MANAGER,
          UserRole.CASHIER,
          UserRole.SALESMAN
        ),
        allowNull: false,
        defaultValue: UserRole.USER,
      },
      phone: {
        type: STRING,
        allowNull: true,
      },
      dob: {
        type: DATEONLY,
        allowNull: true,
      },
      BusinessId: {
        type: UUID,
        allowNull: true,
        references: {
          model: "businesses",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("vehicles", {
      id: {
        type: UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: UUIDV4,
      },
      make: { type: STRING, allowNull: false },
      model: { type: STRING, allowNull: false },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("permissions", {
      id: {
        type: UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: UUIDV4,
      },
      name: { type: STRING, allowNull: false },
      description: STRING,
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("user_permission", {
      PermissionId: {
        type: UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "permissions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      UserId: {
        type: UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("payments", {
      id: {
        type: UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: UUIDV4,
      },
      totalAmount: { type: FLOAT, allowNull: false },
      paidAmount: { type: FLOAT, allowNull: false },
      paymentMethod: { type: STRING, allowNull: false },
      cardNumber: STRING,
      InvoiceId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "invoices",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("packages", {
      id: {
        type: UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: UUIDV4,
      },
      name: { type: STRING, allowNull: false },
      description: STRING,
      BusinessId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "businesses",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("package_product", {
      PackageId: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "packages",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      ProductId: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      quantity: { type: INTEGER, allowNull: false },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("product_tax", {
      ProductId: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      TaxId: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "taxes",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("invoice_audits", {
      id: {
        type: UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: UUIDV4,
      },
      invoiceId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "invoices",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      userId: {
        type: UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      fieldName: { type: STRING, allowNull: false },
      oldValue: TEXT,
      newValue: TEXT,
      changeType: {
        type: ENUM(
          "UPDATE",
          "ADD",
          "REMOVE",
          "UPDATE_ADD",
          "UPDATE_REMOVE",
          "ADD_REMOVE",
          "MULTIPLE"
        ),
        allowNull: false,
      },
      timestamp: { type: DATE },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("invoice_product", {
      quantity: { type: INTEGER, allowNull: false, defaultValue: 1 },
      description: { type: STRING, allowNull: true, defaultValue: "" },
      price: { type: FLOAT, allowNull: false, defaultValue: 0 },
      replacement_reminder_date: { type: DATE, allowNull: true },
      ProductId: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      InvoiceId: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "invoices",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("quotation_product", {
      quantity: { type: INTEGER, allowNull: false, defaultValue: 1 },
      description: { type: STRING, allowNull: true, defaultValue: "" },
      price: { type: FLOAT, allowNull: false, defaultValue: 0 },
      ProductId: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      QuotationId: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "quotations",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("workorder_product", {
      quantity: { type: INTEGER, allowNull: false, defaultValue: 1 },
      description: { type: STRING, allowNull: true, defaultValue: "" },
      price: { type: FLOAT, allowNull: false, defaultValue: 0 },
      ProductId: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      WorkOrderId: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "workorders",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("inspections", {
      id: {
        type: UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: UUIDV4,
      },
      data: { type: JSON, allowNull: false },
      CustomerId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      CustomerVehicleId: {
        type: UUID,
        allowNull: true,
        references: {
          model: "customer_vehicles",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      createdAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

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
          "VOIDED"
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
        references: {
          model: "customers",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      },
      CustomerVehicleId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "customer_vehicles",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
      },
      BusinessId: {
        type: UUID,
        allowNull: false,
        references: {
          model: "businesses",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
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
        onUpdate: "RESTRICT",
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
        onUpdate: "RESTRICT",
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
    await queryInterface.dropTable("archived_invoice_product");
    await queryInterface.dropTable("archived_invoices");
    await queryInterface.dropTable("inspections");
    await queryInterface.dropTable("workorder_product");
    await queryInterface.dropTable("quotation_product");
    await queryInterface.dropTable("invoice_product");
    await queryInterface.dropTable("invoice_audits");
    await queryInterface.dropTable("product_tax");
    await queryInterface.dropTable("package_product");
    await queryInterface.dropTable("packages");
    await queryInterface.dropTable("payments");
    await queryInterface.dropTable("user_permission");
    await queryInterface.dropTable("permissions");
    await queryInterface.dropTable("vehicles");
    await queryInterface.dropTable("users");
    await queryInterface.dropTable("taxes");
    await queryInterface.dropTable("workorders");
    await queryInterface.dropTable("product_categories");
    await queryInterface.dropTable("products");
    await queryInterface.dropTable("quotations");
    await queryInterface.dropTable("invoices");
    await queryInterface.dropTable("customer_vehicles");
    await queryInterface.dropTable("appointments");
    await queryInterface.dropTable("addresses");
    await queryInterface.dropTable("customers");
    await queryInterface.dropTable("businesses");
  },
};
