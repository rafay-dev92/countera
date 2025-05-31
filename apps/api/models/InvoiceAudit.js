const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const InvoiceAudit = sequelize.define("InvoiceAudit", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    invoiceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    fieldName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    changeType: {
      type: DataTypes.ENUM(
        'UPDATE',
        'ADD',
        'REMOVE',
        'UPDATE_ADD',
        'UPDATE_REMOVE',
        'ADD_REMOVE',
        'MULTIPLE'
      ),
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    tableName: 'invoice_audits',
    timestamps: true
  });

  // Define associations
  InvoiceAudit.associate = (models) => {
    InvoiceAudit.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'Invoice'
    });
    
    InvoiceAudit.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'User'
    });
  };

  return InvoiceAudit;
}; 