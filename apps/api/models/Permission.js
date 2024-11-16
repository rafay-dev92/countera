const { DataTypes } = require('sequelize');

module.exports= (sequelize) => {
    const Permission = sequelize.define('Permission', {
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
        }
    },{
        tableName: 'permissions'
    })

    Permission.associate = (models) => {
        Permission.belongsToMany(models.User, {
            as: 'User',
            through: 'user_permission'
        });
    };
    
    return Permission;
}