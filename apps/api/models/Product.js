const { DataTypes } = require('sequelize');

module.exports= (sequelize) => {
    const Product = sequelize.define('Product', {
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
        price: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        cost: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        itemCode:{
            type: DataTypes.STRING,
            allowNull: true,

        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        taxable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
    })

    Product.associate = (models) => {
        Product.belongsToMany(models.Invoice, {
            as: 'Invoice',
            through: 'Invoice_Product'
        })
    }

    return Product;
}