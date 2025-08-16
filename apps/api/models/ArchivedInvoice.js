const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ArchivedInvoice = sequelize.define(
    "ArchivedInvoice",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      originalInvoiceId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      invoiceNumber: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      discount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      paymentStatus: {
        type: DataTypes.ENUM(
          "UNPAID",
          "PARTIALLY_PAID",
          "PAID",
          "REFUNDED",
          "VOID"
        ),
        allowNull: false,
        defaultValue: "UNPAID",
        validate: {
          isIn: {
            args: [["PAID", "PARTIALLY_PAID", "UNPAID", "VOID", "REFUNDED"]],
            msg: "Payment status must be either 'PAID', 'PARTIALLY_PAID', 'UNPAID', 'VOID', or 'REFUNDED'",
          },
        },
      },
      paidAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      notes: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      comments: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      manufactureWarranty: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      roadHazardWarranty: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      flatRepairWarranty: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      rotationWarranty: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      noWarranty: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      balanceWarranty: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      payments: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
          const rawValue = this.getDataValue("payments");
          return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
          this.setDataValue("payments", JSON.stringify(value));
        },
      },
      CustomerId: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      CustomerVehicleId: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      BusinessId: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "archived_invoices",
    }
  );

  ArchivedInvoice.associate = (models) => {
    // ArchivedInvoice.hasMany(models.Payment, {
    //     foreignKey: 'AInvoiceId',
    //     as: 'Payments'
    // });

    ArchivedInvoice.belongsToMany(models.Product, {
      as: "Products",
      through: "archived_invoice_product",
    });

    ArchivedInvoice.belongsTo(models.Customer, {
      as: "Customer",
    });

    ArchivedInvoice.belongsTo(models.CustomerVehicle, {
      as: "CustomerVehicle",
    });

    ArchivedInvoice.belongsTo(models.Business, {
      as: "Business",
    });
  };

  // Define a hook to set the invoiceNumber before creating a new invoice
  // Invoice.beforeCreate(async (invoice, options) => {
  //     const transaction = options.transaction || await Invoice.sequelize.transaction();
  //     try {
  //         const latestInvoice = await Invoice.findOne({
  //             where: { BusinessId: invoice.BusinessId }, // Filter by BusinessId
  //             order: [['createdAt', 'DESC']], // Sort by creation date
  //             lock: transaction.LOCK.UPDATE, // Lock rows to prevent race conditions
  //             transaction,
  //         });

  //         const nextInvoiceNumber = latestInvoice ? latestInvoice.invoiceNumber + 1 : 1;
  //         invoice.invoiceNumber = nextInvoiceNumber;

  //         if (!options.transaction) await transaction.commit();
  //     } catch (error) {
  //         if (!options.transaction) await transaction.rollback();
  //         throw error;
  //     }
  // });

  return ArchivedInvoice;
};
