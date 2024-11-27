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
      products: {
        type: DataTypes.STRING,
        allowNull: false,
        get() {
          return this.getDataValue("products").split(";");
        },
        set(val) {
          this.setDataValue("products", val.join(";"));
        },
      },
    },
    {
      tableName: "workorders",
    }
  );

  WorkOrder.associate = (models) => {
    WorkOrder.belongsTo(models.Customer, {
      as: "Customer",
    });
  };

  return WorkOrder;
};
