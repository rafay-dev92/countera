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
    },{
        tableName: 'businesses'
    })

    Business.associate = (models) => {
        Business.hasMany(models.User, {
            as: 'User'
        });

        Business.hasMany(models.Customer, {
            as: 'Customer'
        });

        Business.hasMany(models.Appointment, {
            as: 'Appointment'
        });

        Business.hasMany(models.Invoice, {
            as: 'Invoice'
        });

        Business.hasMany(models.Quotation, {
            as: 'Quotation'
        });

        Business.hasMany(models.Tax, {
            as: 'Tax'
        });
    };

    return Business;
}