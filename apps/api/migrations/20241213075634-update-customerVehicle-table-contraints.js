"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "customer_vehicles", // Table name
      "customer_vehicles_ibfk_1" // Constraint name (replace if necessary with the correct one from your database)
    );

    // Add a new foreign key with CASCADE on delete
    await queryInterface.addConstraint("customer_vehicles", {
      fields: ["CustomerId"],
      type: "foreign key",
      name: "CustomerId", // Naming the foreign key
      references: {
        table: "customers", // Referenced table
        field: "id", // Referenced column
      },
      onDelete: "CASCADE", // Change onDelete to CASCADE
      onUpdate: "CASCADE", // Keep onUpdate as CASCADE
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "customer_vehicles", // Table name
      "CustomerId" // Constraint name
    );

    // Add the original foreign key with RESTRICT on delete
    await queryInterface.addConstraint("customer_vehicles", {
      fields: ["CustomerId"],
      type: "foreign key",
      name: "CustomerId", // Naming the foreign key
      references: {
        table: "customers", // Referenced table
        field: "id", // Referenced column
      },
      onDelete: "RESTRICT", // Revert to RESTRICT
      onUpdate: "CASCADE", // Keep onUpdate as CASCADE
    });
  },
};
