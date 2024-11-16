const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const quotation_product = sequelize.define('quotation_product', {
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false
        }
    },{
        tableName: 'quotation_product'
    });

    quotation_product.associate = (models) => {
   
        quotation_product.belongsTo(models.Quotation, {
            as: 'Quotation'
        })

        quotation_product.belongsTo(models.Product, {
            as: 'Product'
        })

    }

    return quotation_product
}