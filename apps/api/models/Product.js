const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Product = sequelize.define(
    "Product",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      margin: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cost: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      itemCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      taxable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      BusinessId: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      // CategoryId: {
      //   type: DataTypes.UUID,
      //   allowNull: false,
      //   references: {
      //     model: "product_categories",
      //     key: "id",
      //   },
      //   onDelete: "CASCADE",
      //   onUpdate: "CASCADE",
      // },
    },
    {
      tableName: "products",
    }
  );

  Product.associate = (models) => {
    Product.belongsTo(models.Business, {
      as: "Business",
    });
    Product.belongsTo(models.Product_Category, {
      foreignKey: "CategoryId",
      as: "Category",
    });
    Product.belongsToMany(models.Invoice, {
      as: "Invoice",
      through: "invoice_product",
    });
    Product.belongsToMany(models.Quotation, {
      as: "Quotation",
      through: "quotation_product",
    });
    Product.belongsToMany(models.Tax, {
      as: "Tax",
      through: "product_tax",
    });
  };

  return Product;
};
