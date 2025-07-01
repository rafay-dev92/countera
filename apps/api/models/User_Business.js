const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const user_business = sequelize.define('user_business', {
        role: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },{
        tableName: 'user_business'
    });

    user_business.associate = (models) => {
        user_business.belongsTo(models.User, {
            foreignKey: 'UserId',
            as: 'User'
        });

        user_business.belongsTo(models.Business, {
            foreignKey: 'BusinessId',
            as: 'Business'
        });
    }

    return user_business
}