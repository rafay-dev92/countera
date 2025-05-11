const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Customer = sequelize.define(
    "Customer",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      customerType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      licenseNo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      taxable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      BusinessId: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      }
    },
    {
      tableName: "customers",
    }
  );

  Customer.associate = (models) => {
    Customer.belongsTo(models.Business, {
      as: "Business",
    });

    Customer.hasOne(models.Address, { 
        onDelete: 'CASCADE',
        foreignKey: 'CustomerId',
        as: 'Address',
    });

    Customer.hasMany(models.Invoice, {
      as: "Invoice",
    });

    Customer.hasMany(models.Quotation, {
      as: "Quotation",
    });

    Customer.hasMany(models.WorkOrder, {
      as: "WorkOrder",
    });

    Customer.hasMany(models.Inspection, {
      as: "Inspection",
    });

    Customer.hasMany(models.CustomerVehicle, {
        onDelete: 'CASCADE',
        foreignKey: 'CustomerId',
        as: 'Vehicle',
    });
  };

  return Customer;
};
