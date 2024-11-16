const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Quotation = sequelize.define('Quotation', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        totalAmount: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        CustomerId: {
            type: DataTypes.UUID,
            allowNull: false,
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        },
        VehicleId: {
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
        }
    }, {
        tableName: 'quotations'
    })

    Quotation.associate = (models) => {
        Quotation.belongsToMany(models.Product, {
            as: 'Product',
            through: 'quotation_product'
        })
        Quotation.belongsTo(models.Customer, {
            as: 'Customer'
        })

        Quotation.belongsTo(models.Vehicle, {
            as: 'Vehicle'
        })

        Quotation.belongsTo(models.Business, {
            as: 'Business'
        })
    }

    return Quotation;
}