/**
 * DHRUVA Database Gateway
 * Engine: 100% PostgreSQL with pg Connection Pool
 * Target Database: dhruva_db
 */

const pg = require('./postgres.js');

// Initialize PostgreSQL pool
pg.initPool();

/**
 * Execute a query returning all matching rows
 */
async function queryAll(sql, params = []) {
  return pg.queryAll(sql, params);
}

/**
 * Execute a query returning the first matching row or null
 */
async function queryGet(sql, params = []) {
  return pg.queryGet(sql, params);
}

/**
 * Execute INSERT/UPDATE/DELETE query
 */
async function execute(sql, params = []) {
  return pg.execute(sql, params);
}

/**
 * Execute raw multi-statement SQL
 */
async function exec(sql) {
  return pg.execRaw(sql);
}

async function execRaw(sql) {
  return pg.execRaw(sql);
}

/**
 * Health check performing real PostgreSQL query: SELECT 1;
 */
async function checkHealth() {
  return pg.checkHealth();
}

module.exports = {
  activeEngine: 'PostgreSQL',
  query: pg.query,
  queryAll,
  queryGet,
  execute,
  exec,
  execRaw,
  withTransaction: pg.withTransaction,
  checkHealth,
  postgres: pg
};
