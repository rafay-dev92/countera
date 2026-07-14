const { DataTypes } = require("sequelize");
const { InvoiceTaxType } = require("@countera/shared");

module.exports = (sequelize) => {
  const Invoice_Tax = sequelize.define(
    "Invoice_Tax",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      InvoiceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "invoices",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      ProductId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      TaxId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "taxes",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      tax_name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      tax_rate: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      tax_type: {
        type: DataTypes.ENUM(InvoiceTaxType.Fixed, InvoiceTaxType.Percentage),
        allowNull: false,
        defaultValue: InvoiceTaxType.Percentage,
      },
      tax_amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
    },
    {
      tableName: "invoice_tax",
      timestamps: true,
    }
  );

  Invoice_Tax.associate = (models) => {
    Invoice_Tax.belongsTo(models.Invoice, {
      foreignKey: "InvoiceId",
      as: "Invoice",
    });

    Invoice_Tax.belongsTo(models.Product, {
      foreignKey: "ProductId",
      as: "Product",
    });

    Invoice_Tax.belongsTo(models.Tax, {
      foreignKey: "TaxId",
      as: "Tax",
    });
  };

  return Invoice_Tax;
};
