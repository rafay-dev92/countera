const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const package_product = sequelize.define('package_product', {
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false
        },
    },{
        tableName: 'package_product'
    });

    package_product.associate = (models) => {
   
        package_product.belongsTo(models.Package, {
            as: 'Package'
        })

        package_product.belongsTo(models.Product, {
            as: 'Product'
        })

    }

    return package_product
}