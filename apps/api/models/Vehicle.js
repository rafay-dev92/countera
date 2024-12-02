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
        }
    },{
        tableName: 'vehicles'
    })
    
    return Vehicle;
}