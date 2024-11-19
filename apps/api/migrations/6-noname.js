'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * removeColumn "CustomerId" from table "vehicles"
 * createTable "CustomerVehicles", deps: [customers, vehicles]
 *
 **/

var info = {
    "revision": 7,
    "name": "noname",
    "created": "2024-11-09T13:49:06.375Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
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
                "vehicles",
                "CustomerId",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "CustomerVehicles",
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
                    "CustomerId": {
                        "type": Sequelize.UUID,
                        "field": "CustomerId",
                        "onUpdate": "CASCADE",
                        "onDelete": "CASCADE",
                        "references": {
                            "model": "customers",
                            "key": "id"
                        },
                        "primaryKey": true
                    },
                    "VehicleId": {
                        "type": Sequelize.UUID,
                        "field": "VehicleId",
                        "onUpdate": "CASCADE",
                        "onDelete": "CASCADE",
                        "references": {
                            "model": "vehicles",
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
            params: ["CustomerVehicles", {
                transaction: transaction
            }]
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
