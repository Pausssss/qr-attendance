const mysql = require("mysql2/promise");
const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME
} = require("./env");

const DB_PORT = process.env.DB_PORT || 3306;

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT
});

module.exports = pool;
