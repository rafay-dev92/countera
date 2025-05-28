const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Product_Category = sequelize.define(
    "Product_Category",
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
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      BusinessId: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "product_categories",
    }
  );

  Product_Category.associate = (models) => {
    Product_Category.hasMany(models.Product, {
      foreignKey: "CategoryId",
      as: "products",
    });
    Product_Category.belongsTo(models.Business, {
      foreignKey: "BusinessId",
      as: "Business",
    });
  };

  return Product_Category;
};
