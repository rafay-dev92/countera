const { DataTypes, Model } = require('sequelize');

module.exports= (sequelize) => {
    const Tax = sequelize.define('Tax', {
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
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        rate: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        default: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    },{
        tableName: 'taxes'
    })

    Tax.associate = (models) => {
        Tax.belongsToMany(models.Product, {
            as: 'Product',
            through: 'product_tax'
        });

        Tax.belongsTo(models.Business, {
            as: 'Business'
        })
    }

    return Tax;
}