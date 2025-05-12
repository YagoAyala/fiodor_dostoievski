require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'dostoievskidb',
  process.env.DB_USER || 'dostoievski',
  process.env.DB_PASS || 'dostoievski',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    port: Number(process.env.DB_PORT) || 5432,
    logging: false,
  }
);

module.exports = sequelize;