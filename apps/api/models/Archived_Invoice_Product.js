const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const archived_invoice_product = sequelize.define('archived_invoice_product', {
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            defaultValue: '',
            allowNull: true
        },
        price: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
            allowNull: false
        },
        replacement_reminder_date: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },{
        tableName: 'archived_invoice_product'
    });

    archived_invoice_product.associate = (models) => {
        archived_invoice_product.belongsTo(models.ArchivedInvoice, {
            as: 'ArchivedInvoice'
        })

        archived_invoice_product.belongsTo(models.Product, {
            as: 'Product'
        })
    }

    return archived_invoice_product
}