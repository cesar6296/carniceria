const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'carniceria',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

async function probarConexionMySQL() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS resultado');
    return { estado: 'ok', detalle: 'Conexión activa a MySQL' };
  } catch (error) {
    return { estado: 'error', mensaje: error.message };
  }
}

module.exports = {
  pool,
  probarConexionMySQL
};
