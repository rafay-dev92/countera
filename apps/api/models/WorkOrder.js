const { DataTypes } = require("sequelize");

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
      workOrderNumber: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "Pending",
        allowNull: false,
      },
      notes: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      comments: {
        type: DataTypes.STRING,
        allowNull: true,
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
      through: "workorder_product",
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

  WorkOrder.beforeCreate(async (workorder, options) => {
    const transaction =
      options.transaction || (await WorkOrder.sequelize.transaction());
    try {
      const latestWorkOrder = await WorkOrder.findOne({
        where: { BusinessId: workorder.BusinessId },
        order: [["createdAt", "DESC"]],
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      const nextWorkOrderNumber = latestWorkOrder
        ? latestWorkOrder.workOrderNumber + 1
        : 1;
      workorder.workOrderNumber = nextWorkOrderNumber;

      if (!options.transaction) await transaction.commit();
    } catch (error) {
      if (!options.transaction) await transaction.rollback();
      throw error;
    }
  });

  return WorkOrder;
};
