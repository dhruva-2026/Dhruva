const { Client, Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const config = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'Soumo@25'
};

async function initPostgres() {
  console.log('🐘 Connecting to PostgreSQL server...');
  const rootClient = new Client({ ...config, database: 'postgres' });
  await rootClient.connect();

  // 1. Create database dhruva_db if not exists
  const dbCheck = await rootClient.query("SELECT 1 FROM pg_database WHERE datname = 'dhruva_db'");
  if (dbCheck.rows.length === 0) {
    console.log('📦 Creating database dhruva_db...');
    await rootClient.query('CREATE DATABASE dhruva_db');
    console.log('✅ Created database dhruva_db');
  } else {
    console.log('ℹ️ Database dhruva_db already exists');
  }
  await rootClient.end();

  // 2. Connect to dhruva_db and apply schema
  console.log('⚡ Applying PostgreSQL schema to dhruva_db...');
  const pool = new Pool({ ...config, database: 'dhruva_db' });
  
  // Try to enable pgvector extension if available, else warn gracefully
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ pgvector extension enabled');
  } catch (extErr) {
    console.log('ℹ️ Vector extension note:', extErr.message);
  }

  const schemaPath = path.join(__dirname, 'schema.postgres.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('✅ PostgreSQL schema successfully executed!');
  } else {
    console.warn('⚠️ schema.postgres.sql not found');
  }

  await pool.end();
}

initPostgres()
  .then(() => console.log('🚀 PostgreSQL initialization completed!'))
  .catch(err => {
    console.error('❌ PostgreSQL init error:', err);
    process.exit(1);
  });
