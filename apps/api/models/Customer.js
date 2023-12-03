const { DataTypes } = require('sequelize');

module.exports= (sequelize) => {
    const Customer = sequelize.define('Customer', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4, 
            primaryKey: true,
            allowNull: false
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        taxable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        Address: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    })

    Customer.associate = (models) => {
        Customer.belongsTo(models.Business, {
            as: 'Business'
        });

        Customer.hasMany(models.Invoice, {
            as: 'Invoice'
        })

        Customer.hasMany(models.Quotation, {
            as: 'Quotation'
        })

        Customer.hasMany(models.WorkOrder, {
            as: 'WorkOrder'
        })
    }

    return Customer;
}