'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "businesses", deps: []
 * createTable "permissions", deps: []
 * createTable "products", deps: []
 * createTable "vehicles", deps: []
 * createTable "appointments", deps: [businesses]
 * createTable "customers", deps: [businesses]
 * createTable "invoices", deps: [customers, vehicles, businesses, invoices]
 * createTable "invoice_product", deps: [invoices, products]
 * createTable "quotations", deps: [customers, vehicles, businesses]
 * createTable "quotation_product", deps: [products, quotations]
 * createTable "taxes", deps: [businesses]
 * createTable "users", deps: [businesses]
 * createTable "workorders", deps: [customers, vehicles]
 * createTable "user_permission", deps: [permissions, users]
 * createTable "product_tax", deps: [products, taxes]
 *
 **/

var info = {
    "revision": 1,
    "name": "noname",
    "created": "2024-10-17T20:35:16.568Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "createTable",
            params: [
                "businesses",
                {
                    "id": {
                        "type": Sequelize.UUID,
                        "field": "id",
                        "allowNull": false,
                        "primaryKey": true,
                        "defaultValue": Sequelize.UUIDV4
                    },
                    "name": {
                        "type": Sequelize.STRING,
                        "field": "name",
                        "allowNull": false
                    },
                    "location": {
                        "type": Sequelize.STRING,
                        "field": "location",
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "permissions",
                {
                    "id": {
                        "type": Sequelize.UUID,
                        "field": "id",
                        "allowNull": false,
                        "primaryKey": true,
                        "defaultValue": Sequelize.UUIDV4
                    },
                    "name": {
                        "type": Sequelize.STRING,
                        "field": "name",
                        "allowNull": false
                    },
                    "description": {
                        "type": Sequelize.STRING,
                        "field": "description",
                        "allowNull": true
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "products",
                {
                    "id": {
                        "type": Sequelize.UUID,
                        "field": "id",
                        "allowNull": false,
                        "primaryKey": true,
                        "defaultValue": Sequelize.UUIDV4
                    },
                    "name": {
                        "type": Sequelize.STRING,
                        "field": "name",
                        "allowNull": false
                    },
                    "price": {
                        "type": Sequelize.FLOAT,
                        "field": "price",
                        "allowNull": false
                    },
                    "description": {
                        "type": Sequelize.STRING,
                        "field": "description",
                        "allowNull": true
                    },
                    "cost": {
                        "type": Sequelize.FLOAT,
                        "field": "cost",
                        "allowNull": true
                    },
                    "itemCode": {
                        "type": Sequelize.STRING,
                        "field": "itemCode",
                        "allowNull": true
                    },
                    "type": {
                        "type": Sequelize.STRING,
                        "field": "type",
                        "allowNull": false
                    },
                    "taxable": {
                        "type": Sequelize.BOOLEAN,
                        "field": "taxable",
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "vehicles",
                {
                    "id": {
                        "type": Sequelize.UUID,
                        "field": "id",
                        "allowNull": false,
                        "primaryKey": true,
                        "defaultValue": Sequelize.UUIDV4
                    },
                    "make": {
                        "type": Sequelize.STRING,
                        "field": "make",
                        "allowNull": false
                    },
                    "model": {
                        "type": Sequelize.STRING,
                        "field": "model",
                        "allowNull": false
                    },
                    "year": {
                        "type": Sequelize.INTEGER,
                        "field": "year",
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "appointments",
                {
                    "id": {
                        "type": Sequelize.UUID,
                        "field": "id",
                        "allowNull": false,
                        "primaryKey": true,
                        "defaultValue": Sequelize.UUIDV4
                    },
                    "customerName": {
                        "type": Sequelize.STRING,
                        "field": "customerName",
                        "allowNull": false
                    },
                    "customerEmail": {
                        "type": Sequelize.STRING,
                        "field": "customerEmail",
                        "allowNull": true
                    },
                    "description": {
                        "type": Sequelize.STRING,
                        "field": "description",
                        "allowNull": true
                    },
                    "startDateTime": {
                        "type": Sequelize.DATE,
                        "field": "startDateTime",
                        "allowNull": false
                    },
                    "endDateTime": {
                        "type": Sequelize.DATE,
                        "field": "endDateTime",
                        "allowNull": false
                    },
                    "sendEmail": {
                        "type": Sequelize.BOOLEAN,
                        "field": "sendEmail",
                        "allowNull": false
                    },
                    "BusinessId": {
                        "type": Sequelize.UUID,
                        "references": {
                            "model": "businesses",
                            "key": "id"
                        },
                        "field": "BusinessId",
                        "onUpdate": "CASCADE",
                        "onDelete": "RESTRICT",
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "customers",
                {
                    "id": {
                        "type": Sequelize.UUID,
                        "field": "id",
                        "allowNull": false,
                        "primaryKey": true,
                        "defaultValue": Sequelize.UUIDV4
                    },
                    "firstName": {
                        "type": Sequelize.STRING,
                        "field": "firstName",
                        "allowNull": false
                    },
                    "lastName": {
                        "type": Sequelize.STRING,
                        "field": "lastName",
                        "allowNull": false
                    },
                    "email": {
                        "type": Sequelize.STRING,
                        "field": "email",
                        "allowNull": false
                    },
                    "phone": {
                        "type": Sequelize.STRING,
                        "field": "phone",
                        "allowNull": false
                    },
                    "taxable": {
                        "type": Sequelize.BOOLEAN,
                        "field": "taxable",
                        "allowNull": false
                    },
                    "address": {
                        "type": Sequelize.STRING,
                        "field": "address",
                        "allowNull": true
                    },
                    "BusinessId": {
                        "type": Sequelize.UUID,
                        "references": {
                            "model": "businesses",
                            "key": "id"
                        },
                        "field": "BusinessId",
                        "onUpdate": "CASCADE",
                        "onDelete": "RESTRICT",
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "invoices",
                {
                    "id": {
                        "type": Sequelize.UUID,
                        "field": "id",
                        "allowNull": false,
                        "primaryKey": true,
                        "defaultValue": Sequelize.UUIDV4
                    },
                    "invoiceNumber": {
                        "type": Sequelize.INTEGER,
                        "field": "invoiceNumber",
                        "unique": true,
                        "allowNull": false
                    },
                    "current": {
                        "type": Sequelize.BOOLEAN,
                        "field": "current",
                        "defaultValue": true
                    },
                    "totalAmount": {
                        "type": Sequelize.FLOAT,
                        "field": "totalAmount",
                        "allowNull": false
                    },
                    "paymentMethod": {
                        "type": Sequelize.STRING,
                        "field": "paymentMethod",
                        "allowNull": false
                    },
                    "paymentStatus": {
                        "type": Sequelize.STRING,
                        "field": "paymentStatus",
                        "allowNull": false
                    },
                    "odometer": {
                        "type": Sequelize.STRING,
                        "field": "odometer",
                        "allowNull": false
                    },
                    "licenseNo": {
                        "type": Sequelize.STRING,
                        "field": "licenseNo",
                        "allowNull": false
                    },
                    "CustomerId": {
                        "type": Sequelize.UUID,
                        "references": {
                            "model": "customers",
                            "key": "id"
                        },
                        "field": "CustomerId",
                        "onUpdate": "CASCADE",
                        "onDelete": "RESTRICT",
                        "allowNull": false
                    },
                    "VehicleId": {
                        "type": Sequelize.UUID,
                        "references": {
                            "model": "vehicles",
                            "key": "id"
                        },
                        "field": "VehicleId",
                        "onUpdate": "CASCADE",
                        "onDelete": "RESTRICT",
                        "allowNull": false
                    },
                    "BusinessId": {
                        "type": Sequelize.UUID,
                        "references": {
                            "model": "businesses",
                            "key": "id"
                        },
                        "field": "BusinessId",
                        "onUpdate": "CASCADE",
                        "onDelete": "RESTRICT",
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    },
                    "realInvoiceId": {
                        "type": Sequelize.UUID,
                        "field": "realInvoiceId",
                        "onUpdate": "CASCADE",
                        "onDelete": "SET NULL",
                        "references": {
                            "model": "invoices",
                            "key": "id"
                        },
                        "allowNull": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "invoice_product",
                {
                    "quantity": {
                        "type": Sequelize.INTEGER,
                        "field": "quantity",
                        "allowNull": false,
                        "defaultValue": 1
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    },
                    "InvoiceId": {
                        "type": Sequelize.UUID,
                        "allowNull": true,
                        "field": "InvoiceId",
                        "onUpdate": "CASCADE",
                        "onDelete": "CASCADE",
                        "references": {
                            "model": "invoices",
                            "key": "id"
                        },
                        "primaryKey": true
                    },
                    "ProductId": {
                        "type": Sequelize.UUID,
                        "allowNull": true,
                        "field": "ProductId",
                        "onUpdate": "CASCADE",
                        "onDelete": "CASCADE",
                        "references": {
                            "model": "products",
                            "key": "id"
                        },
                        "primaryKey": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "quotations",
                {
                    "id": {
                        "type": Sequelize.UUID,
                        "field": "id",
                        "allowNull": false,
                        "primaryKey": true,
                        "defaultValue": Sequelize.UUIDV4
                    },
                    "totalAmount": {
                        "type": Sequelize.FLOAT,
                        "field": "totalAmount",
                        "allowNull": false
                    },
                    "CustomerId": {
                        "type": Sequelize.UUID,
                        "references": {
                            "model": "customers",
                            "key": "id"
                        },
                        "field": "CustomerId",
                        "onUpdate": "CASCADE",
                        "onDelete": "RESTRICT",
                        "allowNull": false
                    },
                    "VehicleId": {
                        "type": Sequelize.UUID,
                        "references": {
                            "model": "vehicles",
                            "key": "id"
                        },
                        "field": "VehicleId",
                        "onUpdate": "CASCADE",
                        "onDelete": "RESTRICT",
                        "allowNull": false
                    },
                    "BusinessId": {
                        "type": Sequelize.UUID,
                        "references": {
                            "model": "businesses",
                            "key": "id"
                        },
                        "field": "BusinessId",
                        "onUpdate": "CASCADE",
                        "onDelete": "RESTRICT",
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "quotation_product",
                {
                    "quantity": {
                        "type": Sequelize.INTEGER,
                        "field": "quantity",
                        "allowNull": false,
                        "defaultValue": 1
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    },
                    "ProductId": {
                        "type": Sequelize.UUID,
                        "allowNull": true,
                        "field": "ProductId",
                        "onUpdate": "CASCADE",
                        "onDelete": "CASCADE",
                        "references": {
                            "model": "products",
                            "key": "id"
                        },
                        "primaryKey": true
                    },
                    "QuotationId": {
                        "type": Sequelize.UUID,
                        "allowNull": true,
                        "field": "QuotationId",
                        "onUpdate": "CASCADE",
                        "onDelete": "CASCADE",
                        "references": {
                            "model": "quotations",
                            "key": "id"
                        },
                        "primaryKey": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "taxes",
                {
                    "id": {
                        "type": Sequelize.UUID,
                        "field": "id",
                        "allowNull": false,
                        "primaryKey": true,
                        "defaultValue": Sequelize.UUIDV4
                    },
                    "name": {
                        "type": Sequelize.STRING,
                        "field": "name",
                        "allowNull": false
                    },
                    "type": {
                        "type": Sequelize.STRING,
                        "field": "type",
                        "allowNull": false
                    },
                    "rate": {
                        "type": Sequelize.FLOAT,
                        "field": "rate",
                        "allowNull": false
                    },
                    "default": {
                        "type": Sequelize.BOOLEAN,
                        "field": "default",
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    },
                    "BusinessId": {
                        "type": Sequelize.UUID,
                        "field": "BusinessId",
                        "onUpdate": "CASCADE",
                        "onDelete": "SET NULL",
                        "references": {
                            "model": "businesses",
                            "key": "id"
                        },
                        "allowNull": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "users",
                {
                    "id": {
                        "type": Sequelize.UUID,
                        "field": "id",
                        "allowNull": false,
                        "primaryKey": true,
                        "defaultValue": Sequelize.UUIDV4
                    },
                    "first_name": {
                        "type": Sequelize.STRING,
                        "field": "first_name",
                        "allowNull": false
                    },
                    "last_name": {
                        "type": Sequelize.STRING,
                        "field": "last_name",
                        "allowNull": false
                    },
                    "email": {
                        "type": Sequelize.STRING,
                        "field": "email",
                        "allowNull": false
                    },
                    "password": {
                        "type": Sequelize.STRING,
                        "field": "password",
                        "allowNull": false
                    },
                    "role": {
                        "type": Sequelize.STRING,
                        "field": "role",
                        "allowNull": false
                    },
                    "dob": {
                        "type": Sequelize.DATEONLY,
                        "field": "dob",
                        "allowNull": true
                    },
                    "BusinessId": {
                        "type": Sequelize.UUID,
                        "references": {
                            "model": "businesses",
                            "key": "id"
                        },
                        "field": "BusinessId",
                        "onUpdate": "CASCADE",
                        "onDelete": "RESTRICT",
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "workorders",
                {
                    "id": {
                        "type": Sequelize.UUID,
                        "field": "id",
                        "allowNull": false,
                        "primaryKey": true,
                        "defaultValue": Sequelize.UUIDV4
                    },
                    "products": {
                        "type": Sequelize.STRING,
                        "field": "products",
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    },
                    "CustomerId": {
                        "type": Sequelize.UUID,
                        "field": "CustomerId",
                        "onUpdate": "CASCADE",
                        "onDelete": "SET NULL",
                        "references": {
                            "model": "customers",
                            "key": "id"
                        },
                        "allowNull": true
                    },
                    "VehicleId": {
                        "type": Sequelize.UUID,
                        "field": "VehicleId",
                        "onUpdate": "CASCADE",
                        "onDelete": "SET NULL",
                        "references": {
                            "model": "vehicles",
                            "key": "id"
                        },
                        "allowNull": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "user_permission",
                {
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    },
                    "PermissionId": {
                        "type": Sequelize.UUID,
                        "field": "PermissionId",
                        "onUpdate": "CASCADE",
                        "onDelete": "CASCADE",
                        "references": {
                            "model": "permissions",
                            "key": "id"
                        },
                        "primaryKey": true
                    },
                    "UserId": {
                        "type": Sequelize.UUID,
                        "field": "UserId",
                        "onUpdate": "CASCADE",
                        "onDelete": "CASCADE",
                        "references": {
                            "model": "users",
                            "key": "id"
                        },
                        "primaryKey": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "product_tax",
                {
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    },
                    "ProductId": {
                        "type": Sequelize.UUID,
                        "field": "ProductId",
                        "onUpdate": "CASCADE",
                        "onDelete": "CASCADE",
                        "references": {
                            "model": "products",
                            "key": "id"
                        },
                        "primaryKey": true
                    },
                    "TaxId": {
                        "type": Sequelize.UUID,
                        "field": "TaxId",
                        "onUpdate": "CASCADE",
                        "onDelete": "CASCADE",
                        "references": {
                            "model": "taxes",
                            "key": "id"
                        },
                        "primaryKey": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        }
    ];
};
var rollbackCommands = function(transaction) {
    return [{
            fn: "dropTable",
            params: ["appointments", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["businesses", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["customers", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["invoices", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["invoice_product", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["permissions", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["products", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["quotations", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["quotation_product", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["taxes", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["users", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["vehicles", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["workorders", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["user_permission", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["product_tax", {
                transaction: transaction
            }]
        }
    ];
};

module.exports = {
    pos: 0,
    useTransaction: true,
    execute: function(queryInterface, Sequelize, _commands)
    {
        var index = this.pos;
        function run(transaction) {
            const commands = _commands(transaction);
            return new Promise(function(resolve, reject) {
                function next() {
                    if (index < commands.length)
                    {
                        let command = commands[index];
                        console.log("[#"+index+"] execute: " + command.fn);
                        index++;
                        queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                    }
                    else
                        resolve();
                }
                next();
            });
        }
        if (this.useTransaction) {
            return queryInterface.sequelize.transaction(run);
        } else {
            return run(null);
        }
    },
    up: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
