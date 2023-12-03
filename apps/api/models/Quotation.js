const { DataTypes } = require('sequelize');

module.exports= (sequelize) => {
    const Quotation = sequelize.define('Quotation', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4, 
            primaryKey: true,
            allowNull: false
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
        },
        totalAmount: {
            type: DataTypes.FLOAT,
            allowNull: false
        }
    })

    Quotation.associate = (models) => {
        Quotation.belongsTo(models.Customer, {
            as: 'Customer'
        })

        Quotation.belongsTo(models.Vehicle, {
            as: 'Vehicle'
        })
    }
    
    return Quotation;
}