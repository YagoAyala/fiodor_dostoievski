require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'dostoievski',
    password: process.env.DB_PASS || 'dostoievski',
    database: process.env.DB_NAME || 'dostoievskidb',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
  },
};