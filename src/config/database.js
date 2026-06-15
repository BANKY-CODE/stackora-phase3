const { Pool } = require('pg');
const config   = require('./env');
const logger   = require('../utils/logger');

const pool = new Pool({
  host:     config.db.host,
  port:     config.db.port,
  database: config.db.name,
  user:     config.db.user,
  password: config.db.password,
  ssl:      config.db.ssl ? { rejectUnauthorized: false } : false,
  min:      config.db.pool.min,
  max:      config.db.pool.max,
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  logger.debug('PostgreSQL: new client connected');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', err.message);
});

/**
 * Test the database connection.
 * Returns true on success, false if DB is not reachable
 * (allows server to start even without DB in development).
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() AS now');
    client.release();
    logger.info(`✅ PostgreSQL connected — server time: ${result.rows[0].now}`);
    return true;
  } catch (err) {
    logger.warn(`⚠️  PostgreSQL not reachable: ${err.message}`);
    logger.warn('   Server will start without a DB connection (dev mode).');
    return false;
  }
}

/**
 * Execute a parameterised query.
 * Usage: await db.query('SELECT * FROM users WHERE id = $1', [id])
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const ms = Date.now() - start;
    logger.debug(`DB query [${ms}ms]: ${text.substring(0, 80)}`);
    return result;
  } catch (err) {
    logger.error(`DB query error: ${err.message} | query: ${text}`);
    throw err;
  }
}

module.exports = { pool, query, testConnection };
