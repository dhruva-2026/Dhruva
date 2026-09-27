# DHRUVA — PostgreSQL & pgvector Database Setup & Operations Manual

This guide documents the complete database setup, configuration, direct access (`psql`), migration, and maintenance workflows for the **DHRUVA Polar Science Portal**.

---

## 1. Architecture Overview

- **Production Primary Database:** PostgreSQL 16+
- **Vector Search Engine:** `pgvector` extension (`vector(58)`)
- **Indexing & Hybrid Ranking:** 10 B-Tree indexes + L2 Normalized Cosine Distance (`<=>`) + BM25 Keyword Matching (0.65 / 0.35 weighting)
- **Object Storage:** Local persistent `/uploads` directory or S3/MinIO compatible object store
- **Development Engine:** SQLite with Porter Stemmer FTS5 (for zero-dependency standalone local development)

---

## 2. Environment Configuration

Configure environment variables in `server/.env`:

```env
# Server Port & Environment
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secure-production-jwt-secret-at-least-32-chars
CLIENT_URL=https://your-dhruva-portal.gov.in

# PostgreSQL Connection String
DATABASE_URL=postgresql://dhruva_user:dhruva_password@localhost:5432/dhruva_db

# Discrete PostgreSQL Parameters (Alternative to DATABASE_URL)
PGHOST=localhost
PGPORT=5432
PGDATABASE=dhruva_db
PGUSER=dhruva_user
PGPASSWORD=dhruva_password
PG_MAX_POOL=20

# Storage Limits
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=25
```

---

## 3. PostgreSQL Database Creation from Scratch

To initialize a new PostgreSQL instance on a server:

```bash
# 1. Connect to administrative postgres console
psql -U postgres

# 2. Create dedicated database user
CREATE USER dhruva_user WITH PASSWORD 'dhruva_secure_password_2026';

# 3. Create production database
CREATE DATABASE dhruva_db OWNER dhruva_user;

# 4. Grant schema privileges
GRANT ALL PRIVILEGES ON DATABASE dhruva_db TO dhruva_user;

# 5. Connect to the new database and enable pgvector
\c dhruva_db
CREATE EXTENSION IF NOT EXISTS vector;
GRANT ALL ON SCHEMA public TO dhruva_user;
```

---

## 4. Applying Schema & Migrations

Execute the production PostgreSQL schema:

```bash
psql -U dhruva_user -d dhruva_db -f server/src/db/schema.postgres.sql
```

This creates the 16 core relational tables:
1. `users` — Role-based accounts (`public`, `researcher`, `admin`)
2. `locations` — Polar stations (Maitri, Bharati, Himadri, IndARC, etc.)
3. `researchers` — Scientist profiles and polar expedition track records
4. `papers` — Metadata, publication years, DOIs, embargo statuses
5. `paper_sections` — Structured document sections (`Abstract`, `Methodology`, `Results`, etc.)
6. `paper_chunks` — Dense vector representations (`vector(58)`) for RAG
7. `ai_outputs` — Simple English & Hindi summaries, glossary, social drafts
8. `mcqs` — Educational multiple choice questions
9. `flashcards` — Polar concept revision flashcards
10. `claims` — Fact-checked scientific claims with confidence scores
11. `verifications` — Admin review decisions (`Approved`, `Edited`, `Rejected`)
12. `embargoes` — Time-locked scientific embargo constraints
13. `media` — Expedition images, videos, infographics
14. `audit_logs` — Tamper-evident administrative action logging
15. `chat_sessions` — Persistent user conversational threads
16. `chat_messages` — Grounded RAG dialog turns and citations

---

## 5. Direct Database Access via `psql`

### Connecting via Connection String
```bash
psql "postgresql://dhruva_user:your_password@localhost:5432/dhruva_db"
```

### Useful Administrative Commands
```sql
-- Check PostgreSQL and pgvector version
SELECT version();
SELECT * FROM pg_extension WHERE extname = 'vector';

-- List all 16 DHRUVA tables
\dt

-- Inspect paper chunks and vector dimensions
\d paper_chunks

-- Check research papers count by region
SELECT polar_region, status, count(*) 
FROM papers 
GROUP BY polar_region, status;

-- Run pgvector Cosine Distance Query
SELECT id, paper_id, section_name, page_number, 
       1 - (embedding <=> '[0.1, 0.2, ...]'::vector) AS cosine_similarity
FROM paper_chunks
ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 5;

-- Safely Exit
\q
```

---

## 6. Automated Health & Readiness Validation

Run automated database verification:

```bash
cd server
npm run db:check
```

Expected output:
```text
[PASS] PostgreSQL connection
[PASS] Authentication
[PASS] Database exists
[PASS] Schema
[PASS] Tables
[PASS] Foreign keys
[PASS] Indexes
[PASS] pgvector
[PASS] Vector dimension
[PASS] CRUD
[PASS] Transactions
[PASS] Data integrity
[PASS] RAG retrieval
[PASS] Embargo
[PASS] Verification
[PASS] Audit logging
[PASS] Backup capability
[PASS] Restore verification

🎉 DATABASE STATUS: READY
```

---

## 7. Backup & Disaster Recovery

### Creating a Snapshot
```bash
# PostgreSQL logical dump
pg_dump -U dhruva_user -d dhruva_db -F c -b -v -f /backups/dhruva_$(date +%Y%m%d).dump

# Application JSON dump
npm run backup
```

### Restoring from Backup
```bash
# Drop and recreate clean database
dropdb -U postgres dhruva_db
createdb -U postgres -O dhruva_user dhruva_db

# Restore from pg_dump
pg_restore -U dhruva_user -d dhruva_db -v /backups/dhruva_backup.dump
```
