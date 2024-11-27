"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.dropTable("CustomerVehicles");
    await queryInterface.removeColumn("vehicles", "year");

    const referencingTables = ["invoices", "quotations", "workorders"];
    for (const table of referencingTables) {
      const constraints = await queryInterface.getForeignKeyReferencesForTable(
        table
      );

      for (const constraint of constraints) {
        if (
          constraint.referencedTableName === "vehicles" &&
          constraint.referencedColumnName === "id"
        ) {
          await queryInterface.removeConstraint(
            table,
            constraint.constraintName
          );
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Step 1: Re-add the 'year' column to the 'vehicles' table
    await queryInterface.addColumn("vehicles", "year", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // Step 2: Recreate foreign key constraints in other tables that reference 'vehicles.vehicleId'
    const referencingTables = ["invoices", "quotations", "workorders"]; // Replace with actual table names
    for (const table of referencingTables) {
      await queryInterface.addConstraint(table, {
        fields: ["vehicleId"],
        type: "foreign key",
        name: "vehicleId",
        references: {
          table: "vehicles",
          field: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  },
};
