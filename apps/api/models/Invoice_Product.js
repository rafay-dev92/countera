const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const invoice_product = sequelize.define('invoice_product', {
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false
        }
    },{
        tableName: 'invoice_product'
    });

    invoice_product.associate = (models) => {
   
        invoice_product.belongsTo(models.Invoice, {
            as: 'Invoice'
        })

        invoice_product.belongsTo(models.Product, {
            as: 'Product'
        })

    }

    return invoice_product
}