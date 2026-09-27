/**
 * PostgreSQL Database Adapter with pgvector for DHRUVA
 * Production Connection Pool, Transaction Management, and Health Checks
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;
let isConnected = false;

function getPostgresConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL.includes('localhost') 
        ? { rejectUnauthorized: false } 
        : false,
      max: parseInt(process.env.PG_MAX_POOL || '20', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
  }

  return {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'dhruva_db',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    max: parseInt(process.env.PG_MAX_POOL || '20', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

function initPool() {
  if (pool) return pool;

  const config = getPostgresConfig();
  pool = new Pool(config);

  pool.on('error', (err) => {
    console.error('⚠️ Unexpected PostgreSQL client error in pool:', err.message);
  });

  return pool;
}

/**
 * Converts SQLite-style `?` parameter placeholders to PostgreSQL `$1, $2, ...`
 */
function convertPlaceholders(sql) {
  let paramIdx = 1;
  return sql.replace(/\?/g, () => `$${paramIdx++}`);
}

/**
 * Execute a query with parameters
 */
async function query(text, params = []) {
  const p = initPool();
  const pgSql = convertPlaceholders(text);
  const start = Date.now();
  try {
    const res = await p.query(pgSql, params);
    return res;
  } catch (err) {
    console.error('PostgreSQL Query Error:', err.message, '\nSQL:', pgSql);
    throw err;
  }
}

/**
 * Returns all matching rows
 */
async function queryAll(text, params = []) {
  const res = await query(text, params);
  return res.rows;
}

/**
 * Returns the first matching row or null
 */
async function queryGet(text, params = []) {
  const res = await query(text, params);
  return res.rows.length > 0 ? res.rows[0] : null;
}

/**
 * Execute INSERT/UPDATE/DELETE
 */
async function execute(text, params = []) {
  const res = await query(text, params);
  return {
    rowCount: res.rowCount,
    rows: res.rows
  };
}

/**
 * Execute a multi-statement transaction safely
 */
async function withTransaction(callback) {
  const p = initPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const transactionDb = {
      query: (text, params = []) => client.query(convertPlaceholders(text), params),
      queryAll: async (text, params = []) => (await client.query(convertPlaceholders(text), params)).rows,
      queryGet: async (text, params = []) => {
        const r = await client.query(convertPlaceholders(text), params);
        return r.rows.length > 0 ? r.rows[0] : null;
      },
      execute: (text, params = []) => client.query(convertPlaceholders(text), params)
    };

    const result = await callback(transactionDb);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Execute raw multi-statement SQL (such as schema initialization)
 */
async function execRaw(sql) {
  const p = initPool();
  return p.query(sql);
}

/**
 * Health check executing a real database query: SELECT 1;
 */
async function checkHealth() {
  try {
    const p = initPool();
    const client = await p.connect();
    const res = await client.query('SELECT 1 as live');
    client.release();
    return {
      status: 'ok',
      database: 'PostgreSQL',
      connected: res.rows[0]?.live === 1
    };
  } catch (err) {
    return {
      status: 'error',
      database: 'PostgreSQL',
      connected: false,
      error: err.message
    };
  }
}

/**
 * Initialize PostgreSQL Schema & pgvector extension
 */
async function initPostgresSchema() {
  try {
    const schemaPath = path.join(__dirname, 'schema.postgres.sql');
    if (fs.existsSync(schemaPath)) {
      const ddl = fs.readFileSync(schemaPath, 'utf8');
      await execRaw(ddl);
      console.log('🐘 PostgreSQL Schema & pgvector extension initialized successfully.');
      return true;
    }
  } catch (err) {
    console.warn('PostgreSQL schema init note:', err.message);
    return false;
  }
}

/**
 * Gracefully close pool
 */
async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPostgresConfig,
  initPool,
  query,
  queryAll,
  queryGet,
  execute,
  withTransaction,
  execRaw,
  checkHealth,
  initPostgresSchema,
  close
};
