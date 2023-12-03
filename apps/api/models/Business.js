const { DataTypes } = require('sequelize');

module.exports= (sequelize) => {
    const Business = sequelize.define('Business', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4, 
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    })

    Business.associate = (models) => {
        Business.hasMany(models.User, {
            as: 'User'
        });

        Business.hasMany(models.Customer, {
            as: 'Customer'
        });
    };

    return Business;
}