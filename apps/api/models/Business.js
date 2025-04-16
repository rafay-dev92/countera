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
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        logo: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
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
        timezone: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'UTC',
        },
        licenseNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        permitNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        tel: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fax: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        defaultMargin: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
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
        Business.hasMany(models.Product, {
            as: 'Product'
        })
    };

    return Business;
}