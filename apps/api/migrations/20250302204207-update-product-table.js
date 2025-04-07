"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'CategoryId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'product_categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Assign a default category to existing products
    // const [categories] = await queryInterface.sequelize.query(
    //   `SELECT id FROM product_categories LIMIT 1;`
    // );

    // if (categories.length > 0) {
    //   await queryInterface.sequelize.query(
    //     `UPDATE products SET "CategoryId" = '${categories[0].id}' WHERE "CategoryId" IS NULL;`
    //   );
    // }

    // Now make the column NOT NULL
    // await queryInterface.changeColumn("products", "CategoryId", {
    //   type: Sequelize.UUID,
    //   allowNull: false, // Enforce NOT NULL after updating existing rows
    //   references: {
    //     model: "product_categories",
    //     key: "id",
    //   },
    //   onDelete: "RESTRICT",
    //   onUpdate: "CASCADE",
    // });

    // Add notes and comments to Invoice table
    await queryInterface.addColumn("invoices", "notes", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("invoices", "comments", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Add notes and comments to Quotation table
    await queryInterface.addColumn("quotations", "notes", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("quotations", "comments", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('products', 'CategoryId');

    // Remove notes and comments from Invoice table
    await queryInterface.removeColumn("invoices", "notes");
    await queryInterface.removeColumn("invoices", "comments");

    // Remove notes and comments from Quotation table
    await queryInterface.removeColumn("quotations", "notes");
    await queryInterface.removeColumn("quotations", "comments");
  },
};
