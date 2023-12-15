const { DataTypes } = require('sequelize');

module.exports= (sequelize) => {
    const Invoice = sequelize.define('Invoice', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4, 
            primaryKey: true,
            allowNull: false
        },
        totalAmount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        paymentStatus: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    })

    Invoice.associate = (models) => {
        Invoice.belongsToMany(models.Product, {
            as: 'Product',
            through: 'Invoice_Product'
        })
   
        Invoice.belongsTo(models.Customer, {
            as: 'Customer'
        })

        Invoice.belongsTo(models.Vehicle, {
            as: 'Vehicle'
        })
    }
    
    return Invoice;
}