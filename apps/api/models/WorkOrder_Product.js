const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const workorder_product = sequelize.define('workorder_product', {
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            defaultValue: '',
            allowNull: true
        },
        price: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
            allowNull: false
        }
    },{
        tableName: 'workorder_product'
    });

    workorder_product.associate = (models) => {
   
        workorder_product.belongsTo(models.WorkOrder, {
            as: 'WorkOrder'
        })

        workorder_product.belongsTo(models.Product, {
            as: 'Product'
        })

    }

    return workorder_product
}