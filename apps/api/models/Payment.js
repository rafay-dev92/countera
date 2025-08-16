const { DataTypes } = require('sequelize');

module.exports= (sequelize) => {
    const Payment = sequelize.define('Payment', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4, 
            primaryKey: true,
            allowNull: false
        },
        totalAmount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        paidAmount: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: false
        },
        cardNumber: {
            type: DataTypes.STRING,
            allowNull: true
        },
        InvoiceId: {
            type: DataTypes.UUID,
            allowNull: false,
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        }
    },{
        tableName: 'payments'
    })

    Payment.associate = (models) => {
        Payment.belongsTo(models.Invoice, {
            foreignKey: 'InvoiceId',
            as: 'Invoice', 
        });

        // Payment.belongsTo(models.ArchivedInvoice, {
        //     foreignKey: 'AInvoiceId',
        //     as: 'ArchivedInvoice', 
        // });
    }

    return Payment;
}