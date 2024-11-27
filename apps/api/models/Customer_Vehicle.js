const { DataTypes } = require('sequelize');
const models = require('.');

module.exports= (sequelize) => {
    const Customer_Vehicle = sequelize.define('customer_vehicles', {
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
            allowNull: false,
        },
        licenseNo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        color: {
            type: DataTypes.STRING,
            allowNull: false,
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

    Customer_Vehicle.associate = (models) => {
        Customer_Vehicle.belongsTo(models.Customer, {
            foreignKey: 'CustomerId',
            as: 'Customer',
        });
    } 
    
    return Customer_Vehicle;
}