const { DataTypes } = require('sequelize');
const models = require('../models');

module.exports= (sequelize) => {
    const Vehicle = sequelize.define('Vehicle', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4, 
            primaryKey: true,
            allowNull: false
        },
        make: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        model: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    },{
        tableName: 'vehicles'
    })

    Vehicle.associate = (models) => {
        Vehicle.hasMany(models.Invoice, {
            as: 'Invoice'
        })

        Vehicle.hasMany(models.Quotation, {
            as: 'Quotation'
        })

        Vehicle.hasMany(models.WorkOrder, {
            as: 'WorkOrder'
        })
        
        Vehicle.belongsToMany(models.Customer, {
            through: 'CustomerVehicles',
            foreignKey: 'VehicleId',
            otherKey: 'CustomerId',
        })
    } 
    
    return Vehicle;
}