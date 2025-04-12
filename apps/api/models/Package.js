const { DataTypes } = require('sequelize');

module.exports= (sequelize) => {
    const Package = sequelize.define('Package', {
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
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        BusinessId: {
            type: DataTypes.UUID,
            allowNull: false,
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        }
    },{
        tableName: 'packages'
    })

    Package.associate = (models) => {
        Package.belongsToMany(models.Product, {
            as: 'Product',
            through: 'package_product'
        });

        Package.belongsTo(models.Business, {
            as: 'Business'
        })
    };
    
    return Package;
}