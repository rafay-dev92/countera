const { DataTypes } = require("sequelize");
const Quotation = require("./Quotation");

module.exports = (sequelize) => {
  const WorkOrder = sequelize.define(
    "WorkOrder",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      QuotationId: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      CustomerId: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      CustomerVehicleId: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      BusinessId: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
    },
    {
      tableName: "workorders",
    }
  );

  WorkOrder.associate = (models) => {
    WorkOrder.belongsToMany(models.Product, {
      as: "Product",
      through: "work_order_product",
    });
    WorkOrder.belongsTo(models.Quotation, {
      as: "Quotation",
    });
    WorkOrder.belongsTo(models.Customer, {
      as: "Customer",
    });
    WorkOrder.belongsTo(models.CustomerVehicle, {
      as: "CustomerVehicle",
    });
    WorkOrder.belongsTo(models.Business, {
      as: "Business",
    });
  };

  return WorkOrder;
};
