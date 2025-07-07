'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { UUID, UUIDV4, STRING, INTEGER, BOOLEAN, DATE, DATEONLY, FLOAT, TEXT, JSON, ENUM } = Sequelize;

    await queryInterface.createTable('businesses', {
      id: { type: UUID, primaryKey: true, allowNull: false, defaultValue: UUIDV4 },
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
      createdAt: { type: DATE, allowNull: false },
      updatedAt: { type: DATE, allowNull: false }
    });

    await queryInterface.createTable('customers', {
      id: { type: UUID, primaryKey: true, allowNull: false, defaultValue: UUIDV4 },
      firstName: { type: STRING, allowNull: false },
      lastName: { type: STRING, allowNull: false },
      customerType: { type: STRING, allowNull: false },
      email: { type: STRING, allowNull: true },
      phone: { type: STRING, allowNull: true },
      licenseNo: { type: STRING, allowNull: true },
      notes: { type: TEXT, allowNull: true },
      taxable: { type: BOOLEAN, allowNull: false },
      BusinessId: { type: UUID, allowNull: false },
      createdAt: { type: DATE, allowNull: false },
      updatedAt: { type: DATE, allowNull: false }
    });

    await queryInterface.createTable('addresses', {
      id: { type: UUID, primaryKey: true, allowNull: false, defaultValue: UUIDV4 },
      street: { type: STRING, allowNull: true },
      city: { type: STRING, allowNull: true },
      state: { type: STRING, allowNull: true },
      zipcode: { type: INTEGER, allowNull: true },
      CustomerId: { type: UUID, allowNull: false },
      createdAt: { type: DATE, allowNull: false },
      updatedAt: { type: DATE, allowNull: false }
    });

    await queryInterface.createTable('appointments', {
      id: { type: UUID, primaryKey: true, allowNull: false, defaultValue: UUIDV4 },
      customerName: { type: STRING, allowNull: false },
      customerEmail: { type: STRING, allowNull: true },
      description: { type: STRING, allowNull: true },
      startDateTime: { type: DATE, allowNull: false },
      endDateTime: { type: DATE, allowNull: false },
      sendEmail: { type: BOOLEAN, allowNull: false },
      BusinessId: { type: UUID, allowNull: false },
      createdAt: { type: DATE, allowNull: false },
      updatedAt: { type: DATE, allowNull: false }
    });

    await queryInterface.createTable('customer_vehicles', {
      id: { type: UUID, primaryKey: true, allowNull: false, defaultValue: UUIDV4 },
      make: { type: STRING, allowNull: false },
      model: { type: STRING, allowNull: false },
      year: { type: INTEGER, allowNull: false },
      odometer: { type: INTEGER, allowNull: false },
      engineSize: { type: STRING, allowNull: true },
      licenseNo: { type: STRING, allowNull: true },
      vinNo: { type: STRING, allowNull: true },
      color: { type: STRING, allowNull: true },
      notes: { type: TEXT, allowNull: true },
      CustomerId: { type: UUID, allowNull: false },
      createdAt: { type: DATE, allowNull: false },
      updatedAt: { type: DATE, allowNull: false }
    });

    await queryInterface.createTable('invoices', {
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
          'UNPAID',
          'PARTIALLY_PAID',
          'PAID',
          'REFUNDED',
          'VOID',
        ),
        allowNull: false,
        defaultValue: 'UNPAID',
      },
      paidAmount: {
        type: FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      notes: STRING,
      comments: STRING,
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
      },
      CustomerVehicleId: {
        type: UUID,
        allowNull: false,
      },
      BusinessId: {
        type: UUID,
        allowNull: false,
      },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('quotations', {
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
      },
      CustomerVehicleId: {
        type: UUID,
        allowNull: false,
      },
      BusinessId: {
        type: UUID,
        allowNull: false,
      },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('workorders', {
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
        type: ENUM(
          'PENDING',
          'FINISHED',
        ),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      notes: STRING,
      comments: STRING,
      CustomerId: {
        type: UUID,
        allowNull: false,
      },
      CustomerVehicleId: {
        type: UUID,
        allowNull: false,
      },
      BusinessId: {
        type: UUID,
        allowNull: false,
      },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('products', {
      id: {
        type: UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: UUIDV4,
      },
      name: {
        type: STRING,
        allowNull: false
      },
      image: STRING,
      margin: FLOAT,
      price: {
        type: FLOAT,
        allowNull: false
      },
      description: STRING,
      cost: FLOAT,
      itemCode: STRING,
      type: {
        type: STRING,
        allowNull: false
      },
      taxable: {
        type: BOOLEAN,
        allowNull: false
      },
      BusinessId: {
        type: UUID,
        allowNull: false
      },
      CategoryId: {
        type: UUID,
        allowNull: false
      },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('taxes', {
      id: {
        type: UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: STRING,
        allowNull: false
      },
      type: {
        type: STRING,
        allowNull: false
      },
      rate: {
        type: FLOAT,
        allowNull: false
      },
      default: {
        type: BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      BusinessId: { type: UUID, allowNull: false },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('users', {
      id: {
        type: UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      first_name: {
        type: STRING,
        allowNull: false
      },
      last_name: {
        type: STRING,
        allowNull: false
      },
      email: {
        type: STRING,
        allowNull: false
      },
      password: {
        type: STRING,
        allowNull: false
      },
      role: {
        type: STRING,
        allowNull: false
      },
      dob: DATEONLY,
      BusinessId: UUID,
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('vehicles', {
      id: { type: UUID, allowNull: false, primaryKey: true, defaultValue: UUIDV4 },
      make: { type: STRING, allowNull: false },
      model: { type: STRING, allowNull: false },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('permissions', {
      id: { type: UUID, allowNull: false, primaryKey: true, defaultValue: UUIDV4 },
      name: { type: STRING, allowNull: false },
      description: STRING,
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('user_permission', {
      PermissionId: {
        type: UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'permissions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      UserId: {
        type: UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: DATE,
        allowNull: false
      },
      updatedAt: {
        type: DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('payments', {
      id: { type: UUID, allowNull: false, primaryKey: true, defaultValue: UUIDV4 },
      totalAmount: { type: FLOAT, allowNull: false },
      paidAmount: { type: FLOAT, allowNull: false },
      paymentMethod: { type: STRING, allowNull: false },
      cardNumber: STRING,
      InvoiceId: { type: UUID, allowNull: false },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('packages', {
      id: { type: UUID, allowNull: false, primaryKey: true, defaultValue: UUIDV4 },
      name: { type: STRING, allowNull: false },
      description: STRING,
      BusinessId: { type: UUID, allowNull: false },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('package_product', {
      PackageId: { type: UUID, allowNull: false },
      ProductId: { type: UUID, allowNull: false },
      quantity: { type: INTEGER, allowNull: false },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('product_tax', {
      ProductId: { type: UUID, allowNull: false },
      TaxId: { type: UUID, allowNull: false },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('product_categories', {
      id: { type: UUID, primaryKey: true, allowNull: false, defaultValue: UUIDV4 },
      name: { type: STRING, allowNull: false },
      description: STRING,
      BusinessId: { type: UUID, allowNull: false },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('invoice_audits', {
      id: { type: UUID, allowNull: false, primaryKey: true, defaultValue: UUIDV4 },
      invoiceId: { type: UUID, allowNull: false },
      userId: { type: UUID, allowNull: false },
      fieldName: { type: STRING, allowNull: false },
      oldValue: TEXT,
      newValue: TEXT,
      changeType: { type: ENUM('UPDATE', 'ADD', 'REMOVE', 'UPDATE_ADD', 'UPDATE_REMOVE', 'ADD_REMOVE', 'MULTIPLE'), allowNull: false },
      timestamp: { type: DATE },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('invoice_product', {
      quantity: { type: INTEGER, allowNull: false, defaultValue: 1 },
      description: { type: STRING, allowNull: true, defaultValue: '' },
      price: { type: FLOAT, allowNull: false, defaultValue: 0 },
      replacement_reminder_date: { type: DATE, allowNull: true },
      ProductId: { type: UUID, allowNull: false },
      InvoiceId: { type: UUID, allowNull: false },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('quotation_product', {
      quantity: { type: INTEGER, allowNull: false, defaultValue: 1 },
      description: { type: STRING, allowNull: true, defaultValue: '' },
      price: { type: FLOAT, allowNull: false, defaultValue: 0 },
      ProductId: { type: UUID, allowNull: false },
      QuotationId: { type: UUID, allowNull: false },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('workorder_product', {
      quantity: { type: INTEGER, allowNull: false, defaultValue: 1 },
      description: { type: STRING, allowNull: true, defaultValue: '' },
      price: { type: FLOAT, allowNull: false, defaultValue: 0 },
      ProductId: { type: UUID, allowNull: false },
      WorkOrderId: { type: UUID, allowNull: false },
      createdAt: DATE,
      updatedAt: DATE
    });

    await queryInterface.createTable('inspections', {
      id: { type: UUID, primaryKey: true, allowNull: false, defaultValue: UUIDV4 },
      data: { type: JSON, allowNull: false },
      CustomerId: { type: UUID, allowNull: true },
      CustomerVehicleId: { type: UUID, allowNull: true },
      createdAt: DATE,
      updatedAt: DATE
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('inspections');
    await queryInterface.dropTable('workorder_product');
    await queryInterface.dropTable('quotation_product');
    await queryInterface.dropTable('invoice_product');
    await queryInterface.dropTable('invoice_audits');
    await queryInterface.dropTable('product_categories');
    await queryInterface.dropTable('product_tax');
    await queryInterface.dropTable('package_product');
    await queryInterface.dropTable('packages');
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('user_permission');
    await queryInterface.dropTable('permissions');
    await queryInterface.dropTable('vehicles');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('taxes');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('workorders');
    await queryInterface.dropTable('quotations');
    await queryInterface.dropTable('invoices');
    await queryInterface.dropTable('customer_vehicles');
    await queryInterface.dropTable('appointments');
    await queryInterface.dropTable('addresses');
    await queryInterface.dropTable('customers');
    await queryInterface.dropTable('businesses');
  }
};
