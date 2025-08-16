require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
  },
  test: {
    username: process.env.DB_TEST_USERNAME || "root",
    password: process.env.DB_TEST_PASSWORD || null,
    database: process.env.DB_TEST_NAME || "database_test",
    host: process.env.DB_TEST_HOST || "127.0.0.1",
    dialect: process.env.DB_TEST_DIALECT || "mysql",
    logging: false,
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
  },
};
