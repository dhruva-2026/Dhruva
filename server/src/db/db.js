/**
 * DHRUVA Database Gateway
 * Production Target: PostgreSQL + pgvector
 * Development/Testing Fallback: Node.js SQLite with FTS5
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const pg = require('./postgres.js');

let activeEngine = 'SQLite';
let sqliteDb = null;

// Initialize SQLite fallback instance for local standalone development
const dbPath = path.join(__dirname, '..', '..', 'dhruva.sqlite');
try {
  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
  
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    sqliteDb.exec(schema);
  }

  // FTS5 Virtual table
  sqliteDb.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS papers_fts USING fts5(
      paper_id UNINDEXED,
      title,
      abstract,
      keywords,
      tokenize = 'porter unicode61'
    );
  `);
} catch (err) {
  console.warn('SQLite init warning:', err.message);
}

function syncPapersFts() {
  if (!sqliteDb) return;
  try {
    const existing = queryGet('SELECT COUNT(*) as count FROM papers_fts');
    const papers = queryAll('SELECT id, title, abstract, keywords FROM papers');
    if (existing && existing.count === 0 && papers.length > 0) {
      sqliteDb.exec('BEGIN TRANSACTION;');
      const stmt = sqliteDb.prepare('INSERT INTO papers_fts (paper_id, title, abstract, keywords) VALUES (?, ?, ?, ?)');
      for (const p of papers) {
        stmt.run(p.id, p.title, p.abstract, p.keywords || '');
      }
      sqliteDb.exec('COMMIT;');
    }
  } catch (err) {
    // Non-fatal
  }
}

// Check initial FTS sync
syncPapersFts();

// Helper wrapper functions
function queryAll(sql, params = []) {
  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.all(...params);
  }
  return [];
}

function queryGet(sql, params = []) {
  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.get(...params);
  }
  return null;
}

function execute(sql, params = []) {
  if (sqliteDb) {
    const stmt = sqliteDb.prepare(sql);
    return stmt.run(...params);
  }
  return { changes: 0 };
}

function exec(sql) {
  if (sqliteDb) {
    return sqliteDb.exec(sql);
  }
}

function execRaw(sql) {
  if (sqliteDb) {
    return sqliteDb.exec(sql);
  }
}

/**
 * Health check performing real DB query
 */
async function checkHealth() {
  // If PostgreSQL is configured, verify real query
  if (process.env.DATABASE_URL || process.env.PGHOST) {
    const pgHealth = await pg.checkHealth();
    if (pgHealth.connected) {
      return pgHealth;
    }
  }

  // Fallback check on SQLite
  try {
    const res = queryGet('SELECT 1 as live');
    return {
      status: 'ok',
      database: 'SQLite (Development)',
      connected: res && (res.live === 1 || res['1'] === 1),
      note: 'Production target is PostgreSQL with pgvector'
    };
  } catch (err) {
    return {
      status: 'error',
      database: 'SQLite',
      connected: false,
      error: err.message
    };
  }
}

module.exports = {
  db: sqliteDb,
  queryAll,
  queryGet,
  execute,
  exec,
  execRaw,
  checkHealth,
  syncPapersFts,
  postgres: pg
};
