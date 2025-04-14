const { DataTypes } = require('sequelize');

module.exports= (sequelize) => {
    const CustomerVehicle = sequelize.define('CustomerVehicle', {
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
        },
        odometer: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        engineSize: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        licenseNo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        color: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        CustomerId: {
            type: DataTypes.UUID,
            allowNull: false,
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        },
    },{
        tableName: 'customer_vehicles'
    })

    CustomerVehicle.associate = (models) => {
        CustomerVehicle.belongsTo(models.Customer, {
            foreignKey: 'CustomerId',
            as: 'Customer',
        });
    } 
    
    return CustomerVehicle;
}