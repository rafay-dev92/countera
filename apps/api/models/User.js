const { DataTypes } = require('sequelize');

module.exports= (sequelize) => {
    const User = sequelize.define('User', {
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
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        dob: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        }
    })

    User.associate = (models) => {
        User.belongsToMany(models.Permission, {
            as: 'Permission',
            through : 'User_Permission',

        });

        User.belongsTo(models.Business, {
            as: 'Business'
        });
    }
    
    return User;
}