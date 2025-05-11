"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("addresses", "street", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn("addresses", "city", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn("addresses", "state", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn("addresses", "zipcode", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("addresses", "street", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn("addresses", "city", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn("addresses", "state", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.changeColumn("addresses", "zipcode", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
