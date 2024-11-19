'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * removeColumn "address" from table "customers"
 * createTable "addresses", deps: []
 * addColumn "AddressId" to table "customers"
 * addColumn "notes" to table "customers"
 * addColumn "licenseNo" to table "customers"
 * addColumn "customerType" to table "customers"
 * addColumn "CustomerId" to table "vehicles"
 * addColumn "VehicleId" to table "customers"
 *
 **/

var info = {
    "revision": 5,
    "name": "noname",
    "created": "2024-11-09T13:18:07.503Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "addColumn",
            params: [
                "customers",
                "notes",
                {
                    "type": Sequelize.TEXT,
                    "field": "notes",
                    "allowNull": true
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "customers",
                "licenseNo",
                {
                    "type": Sequelize.STRING,
                    "field": "licenseNo",
                    "allowNull": true
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "customers",
                "customerType",
                {
                    "type": Sequelize.STRING,
                    "field": "customerType",
                    "allowNull": false
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "vehicles",
                "CustomerId",
                {
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
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "customers",
                "VehicleId",
                {
                    "type": Sequelize.UUID,
                    "field": "VehicleId",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "vehicles",
                        "key": "id"
                    },
                    "allowNull": true
                },
                {
                    transaction: transaction
                }
            ]
        }
    ];
};
var rollbackCommands = function(transaction) {
    return [{
            fn: "removeColumn",
            params: [
                "customers",
                "VehicleId",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "customers",
                "AddressId",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "customers",
                "notes",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "customers",
                "licenseNo",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "customers",
                "customerType",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "vehicles",
                "CustomerId",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "dropTable",
            params: ["addresses", {
                transaction: transaction
            }]
        },
        {
            fn: "addColumn",
            params: [
                "customers",
                "address",
                {
                    "type": Sequelize.STRING,
                    "field": "address",
                    "allowNull": true
                },
                {
                    transaction: transaction
                }
            ]
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
