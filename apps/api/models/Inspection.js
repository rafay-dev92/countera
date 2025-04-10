const { DataTypes, Model } = require('sequelize');

module.exports= (sequelize) => {
    const Inspection = sequelize.define('Inspection', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4, 
            primaryKey: true,
            allowNull: false
        },
        data: {
            type: DataTypes.JSON,
            allowNull: false,
        }               
    },{
        tableName: 'inspections'
    })

    Inspection.associate = (models) => {
        Inspection.belongsTo(models.Customer, {
            as: 'Customer'
        })

        Inspection.belongsTo(models.CustomerVehicle, {
            as: 'CustomerVehicle'
        })
    }

    return Inspection;
}