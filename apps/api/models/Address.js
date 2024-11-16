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
            allowNull: false,
        },
        city: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        state: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        zipcode: {
            type: DataTypes.INTEGER,
            allowNull: false,
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