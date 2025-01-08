const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Invoice = sequelize.define('Invoice', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        invoiceNumber: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
            unique: true,
        },
        current: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        totalAmount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        paymentStatus: {
            type: DataTypes.STRING,
            allowNull: false,
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
        }
    }, {
        tableName: 'invoices'
    })

    Invoice.associate = (models) => {
        Invoice.hasMany(models.Payment, {
            foreignKey: 'InvoiceId',
            as: 'Payments'
        });

        Invoice.belongsToMany(models.Product, {
            as: 'Product',
            through: 'invoice_product'
        })

        Invoice.belongsTo(models.Customer, {
            as: 'Customer'
        })

        Invoice.belongsTo(models.CustomerVehicle, {
            as: 'CustomerVehicle'
        })

        Invoice.belongsTo(models.Business, {
            as: 'Business'
        })

        Invoice.belongsTo(Invoice, { as: 'realInvoice' });
    }

    // Define a hook to set the invoiceNumber before creating a new invoice
    Invoice.beforeCreate(async (invoice, options) => {
        const latestInvoice = await findLatestInvoice();
        const nextInvoiceNumber = latestInvoice ? latestInvoice.invoiceNumber + 1 : 1;
        invoice.invoiceNumber = nextInvoiceNumber;
    });

    // Method to find the latest invoice number
    async function findLatestInvoice() {
        return Invoice.findOne({
            order: [['createdAt', 'DESC']], // Assuming you have a createdAt field
        });
    }

    return Invoice;
}