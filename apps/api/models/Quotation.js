const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Quotation = sequelize.define(
    "Quotation",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      quotationNumber: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
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
      tableName: "quotations",
    }
  );

  Quotation.associate = (models) => {
    Quotation.belongsToMany(models.Product, {
      as: "Product",
      through: "quotation_product",
    });

    Quotation.belongsTo(models.Customer, {
      as: "Customer",
    });

    Quotation.belongsTo(models.CustomerVehicle, {
      as: "CustomerVehicle",
    });

    Quotation.belongsTo(models.Business, {
      as: "Business",
    });
  };

  Quotation.beforeCreate(async (quotation, options) => {
    const transaction =
      options.transaction || (await Quotation.sequelize.transaction());
    try {
      const latestQuotation = await Quotation.findOne({
        where: { BusinessId: quotation.BusinessId }, // Filter by BusinessId
        order: [["createdAt", "DESC"]], // Sort by creation date
        lock: transaction.LOCK.UPDATE, // Lock rows to prevent race conditions
        transaction,
      });

      const nextQuotationNumber = latestQuotation
        ? latestQuotation.invoiceNumber + 1
        : 1;
      quotation.quotationNumber = nextQuotationNumber;

      if (!options.transaction) await transaction.commit();
    } catch (error) {
      if (!options.transaction) await transaction.rollback();
      throw error;
    }
  });

  return Quotation;
};
