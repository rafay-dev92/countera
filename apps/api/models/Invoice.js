const { DataTypes } = require('sequelize');

module.exports= (sequelize) => {
    const Invoice = sequelize.define('Invoice', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4, 
            primaryKey: true,
            allowNull: false
        },
        totalAmount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        paymentStatus: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        products: {
            type: DataTypes.STRING,
            allowNull: false,
            get() {
                return this.getDataValue('products').split(';')
            },
            set(val) {
               this.setDataValue('products',val.join(';'));
            },
        }
    })

    Invoice.associate = (models) => {
        Invoice.belongsTo(models.Customer, {
            as: 'Customer'
        })

        Invoice.belongsTo(models.Vehicle, {
            as: 'Vehicle'
        })
    }
    
    return Invoice;
}