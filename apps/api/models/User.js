const { DataTypes } = require("sequelize");
const { UserRole } = require("@countera/shared");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
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
        type: DataTypes.ENUM(
          UserRole.SUPER_ADMIN,
          UserRole.ADMIN,
          UserRole.USER,
          UserRole.MANAGER,
          UserRole.CASHIER,
          UserRole.SALESMAN
        ),
        defaultValue: UserRole.USER,
        allowNull: false,
        validate: {
          isIn: {
            args: [
              [
                UserRole.SUPER_ADMIN,
                UserRole.ADMIN,
                UserRole.USER,
                UserRole.MANAGER,
                UserRole.CASHIER,
                UserRole.SALESMAN,
              ],
            ],
            msg: "Role must be one of 'ADMIN', 'USER', 'MANAGER', 'CASHIER', or 'SALESMAN'",
          },
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dob: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      BusinessId: {
        type: DataTypes.UUID,
        allowNull: true,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "users",
    }
  );

  User.associate = (models) => {
    User.belongsToMany(models.Permission, {
      as: "Permission",
      through: "user_permission",
    });

    User.belongsTo(models.Business, {
      as: "Business",
    });
  };

  return User;
};
