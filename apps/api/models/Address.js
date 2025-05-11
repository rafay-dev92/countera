const { DataTypes } = require('sequelize');

module.exports= (sequelize) => {
    const Address = sequelize.define('Address', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4, 
            primaryKey: true,
            allowNull: false
        },
        street: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        state: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        zipcode: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        CustomerId: {
            type: DataTypes.UUID,
            allowNull: false,
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        },
    },{
        tableName: 'addresses'
    })

    Address.associate = (models) => {
        Address.belongsTo(models.Customer, {
            foreignKey: 'CustomerId',
            as: 'Customer',
        });
    }

    return Address;
}