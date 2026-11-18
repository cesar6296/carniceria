const mysql = require('mysql2/promise');
require('dotenv').config();

const usarSSL = process.env.MYSQL_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'carniceria',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT || '5', 10),
  queueLimit: 0,
  connectTimeout: parseInt(process.env.MYSQL_CONNECT_TIMEOUT || '4000', 10),
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ...(usarSSL ? { ssl: { rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED === 'true' } } : {})
});

// Si MySQL no responde, no esperamos el timeout completo en cada petición:
// durante un rato se responde de inmediato con los datos de respaldo en memoria.
const ESPERA_TRAS_FALLO_MS = parseInt(process.env.MYSQL_RETRY_MS || '60000', 10);

const CODIGOS_SIN_CONEXION = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EHOSTUNREACH',
  'EAI_AGAIN',
  'EPIPE',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_SEQUENCE_TIMEOUT',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR',
  'ER_BAD_HOST_ERROR',
  'ER_HOST_NOT_PRIVILEGED'
]);

let caidoHasta = 0;
let ultimoError = null;

function mensajeDeError(error) {
  if (!error) return 'No se pudo conectar a MySQL';
  if (error.message) return error.message;
  if (Array.isArray(error.errors) && error.errors[0] && error.errors[0].message) {
    return error.errors[0].message;
  }
  return 'No se pudo conectar a MySQL';
}

function esFalloDeConexion(error) {
  return Boolean(error && (error.fatal || CODIGOS_SIN_CONEXION.has(error.code)));
}

const queryOriginal = pool.query.bind(pool);

pool.query = function queryConProteccion(...args) {
  if (Date.now() < caidoHasta) {
    return Promise.reject(ultimoError || new Error('MySQL no disponible (modo demostración)'));
  }

  return queryOriginal(...args).then(
    (resultado) => {
      caidoHasta = 0;
      ultimoError = null;
      return resultado;
    },
    (error) => {
      if (esFalloDeConexion(error)) {
        ultimoError = error;
        caidoHasta = Date.now() + ESPERA_TRAS_FALLO_MS;
      }
      throw error;
    }
  );
};

async function probarConexionMySQL() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS resultado');
    return { estado: 'ok', detalle: 'Conexión activa a MySQL' };
  } catch (error) {
    return { estado: 'error', mensaje: mensajeDeError(error) };
  }
}

module.exports = {
  pool,
  probarConexionMySQL,
  mensajeDeError
};
