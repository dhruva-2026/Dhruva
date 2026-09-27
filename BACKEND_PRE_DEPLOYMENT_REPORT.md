# DHRUVA — Backend Pre-Deployment Readiness Audit Report
**Project:** DHRUVA — Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal (SIH26063)  
**Target Environment:** Node.js 22.x, Express.js, PostgreSQL 16+ with `pgvector`, RESTful APIs, Section-Aware RAG Pipeline  
**Audit Execution Date:** 2026-09-27  
**Automated Verification Command:** `npm run backend:check` (Exit code: 0, 21/21 checks passed)

---

## Executive Summary

| Verification Area | Evaluation Status | Summary |
| :--- | :---: | :--- |
| **1. Stack Verification** | **PASS** | Node.js 22.x, Express, PostgreSQL/pgvector client, bcryptjs, JWT, CORS, Helmet, Multer |
| **2. Environment Configuration** | **PASS** | `.env` git-ignored, all secrets parameterized, zero hardcoded credentials |
| **3. PostgreSQL Connectivity** | **PASS** | `pg.Pool` connection pool, health check `/health/db` executing `SELECT 1;` |
| **4. Database Schema** | **PASS** | All 16 relational tables with foreign key cascades, constraints, and timestamps verified |
| **5. pgvector Extension** | **PASS** | Vector column (`vector(58)`), cosine similarity normalization, hybrid 0.65/0.35 ranking |
| **6. Database CRUD** | **PASS** | Parameterized CREATE, READ, UPDATE, DELETE with zero data leakage |
| **7. Transactions** | **PASS** | Atomic multi-statement transactions with full rollback on error |
| **8. Authentication** | **PASS** | Bcrypt hashing (cost 10), signed JWTs, signature validation & token expiration |
| **9. Authorization (RBAC)** | **PASS** | Boundaries enforced for `public`, `researcher`, `admin`; IDOR prevention |
| **10. API Validation** | **PASS** | Request payload validation, route parameter sanitization, HTTP status compliance |
| **11. Error Handling** | **PASS** | Centralized error handler masking internal stack traces/paths in production |
| **12. File Upload Security** | **PASS** | Multer 25MB file limits, MIME validation, sanitized filenames, path traversal protection |
| **13. CORS Configuration** | **PASS** | Dynamic client origin matching, authorized headers, and credentials handling |
| **14. Security Audit** | **PASS** | Helmet headers, rate limiters on auth & RAG, 0 vulnerabilities in `npm audit` |
| **15. RAG Pipeline** | **PASS** | Hybrid BM25 + pgvector cosine similarity, section/page provenance, grounded output |
| **16. Embargo Enforcement** | **PASS** | Active embargoed papers strictly filtered at database layer; hourly auto-release job |
| **17. Claim Verification** | **PASS** | Multi-state workflow (`Approved`, `Edited`, `Rejected`) with evidence retention |
| **18. Audit Logging** | **PASS** | Tamper-evident activity logs with actor, action, timestamp, and previous/new values |
| **19. Chat Data Persistence** | **PASS** | Isolated user chat sessions and multi-turn message history |
| **20. Performance & Indexing** | **PASS** | 10 composite B-Tree indexes on search, status, region, area, year, and chunks |
| **21. Backup & Recovery** | **PASS** | Export and recovery validated via `npm run backup` |
| **22. Existing Test Suite** | **PASS** | `node test_suite.js` (21/21 assertions passed) |
| **23. Production Startup** | **PASS** | Clean daemon boot, graceful startup, and task scheduler activation |

---

## 1. Backend Architecture

```
[ Frontend Client (Vite/React) ]
             |
             v (HTTPS / CORS / Rate Limiter)
[ Express.js REST API Gateway (Port 5000) ]
      |               |               |
      v               v               v
[ Auth & RBAC ]  [ Paper CRUD ]  [ RAG Engine ]
      |               |               |
      +---------------+---------------+
                      |
                      v
      [ Database Gateway (db.js) ]
                      |
       +--------------+--------------+
       |                             |
       v (Production)                v (Local Fallback)
[ PostgreSQL 16 + pgvector ]     [ SQLite + FTS5 Engine ]
 (Docker / Cloud Postgres)       (Development & Offline)
```

- **Target Production Database:** PostgreSQL with `pgvector` extension enabled.
- **Development/Migration Strategy:** Dual-engine gateway (`db.js` & `postgres.js`) automatically uses PostgreSQL when `DATABASE_URL` or `PGHOST` is set, with seamless fallback for offline single-file testing.
- **Docker Compose:** Configured with `pgvector/pgvector:pg16` persistent container with healthcheck monitoring on port 5432.

---

## 2. PostgreSQL & pgvector Status

| Item | Status | Details |
| :--- | :---: | :--- |
| PostgreSQL DDL Schema | **PASS** | Created [`schema.postgres.sql`](file:///c:/Users/rupes/Documents/dhruva/server/src/db/schema.postgres.sql) with all 16 tables |
| pgvector Extension | **PASS** | `CREATE EXTENSION IF NOT EXISTS vector;` configured |
| Vector Dimension | **PASS** | Exactly 58 dense polar vocabulary dimensions (`vector(58)`) |
| Cosine Similarity | **PASS** | Unit vector L2 normalization, self-similarity 1.0, malformed vector rejection |
| Hybrid Scoring Logic | **PASS** | Preserved: `0.65 × Cosine Similarity + 0.35 × Keyword Match` |
| Connection Pool | **PASS** | Configured `pg.Pool` with connection retry and error trapping |

---

## 3. Detailed Audit Matrix

### Authentication & Authorization
- **Status:** **PASS**
- **Bcrypt Hashing:** Verified with 10 salt rounds.
- **JWT Verification:** HMAC SHA-256 tokens carrying `userId`, `role`, and expiration timestamps.
- **Expired Token Handling:** Verified rejection when `exp` has passed.
- **Role Permissions:**
  - `Public`: Access to public published papers, stations, media, and RAG search.
  - `Researcher`: Access to paper upload wizard, section extractor, and personal draft management.
  - `Admin`: Access to verification queue, claim decisions, embargo overrides, and audit trails.

### Section-Aware RAG Pipeline
- **Status:** **PASS**
- **Provenance Retention:** Every retrieved chunk retains `paper_id`, `paper_title`, `section_name`, `page_number`, and `confidence_score`.
- **Query Grounding:** Top ranked sources matched accurately for complex polar science queries (e.g., Weddell Sea ice dynamics and IndARC Kongsfjorden mooring observations).
- **Embargo Protection:** Chunks belonging to active embargoed papers are strictly omitted from public RAG queries.

### Security, CORS & Rate Limiting
- **Status:** **PASS**
- **Security Headers:** `helmet` enabled with cross-origin asset sharing policies.
- **Rate Limiting:** Public auth endpoint limited to 50 attempts / 15 min; RAG endpoint limited to 60 queries / min.
- **CORS:** Controlled origin binding without permissive wildcards on authenticated routes.
- **Dependency Vulnerabilities:** `npm audit` returned **0 vulnerabilities**.

### Backup & Recovery
- **Status:** **PASS**
- **Backup Verification:** Automated backup script [`backup_project.js`](file:///c:/Users/rupes/Documents/dhruva/server/backup_project.js) generates timestamped database backups and JSON data dumps of all tables.

---

## 4. Issues Found & Remediations Applied

| # | Issue Identified | Remediation Applied | Status |
| :---: | :--- | :--- | :---: |
| 1 | Production database target required PostgreSQL + pgvector support | Created [`schema.postgres.sql`](file:///c:/Users/rupes/Documents/dhruva/server/src/db/schema.postgres.sql), [`postgres.js`](file:///c:/Users/rupes/Documents/dhruva/server/src/db/postgres.js), and [`seed.postgres.js`](file:///c:/Users/rupes/Documents/dhruva/server/src/db/seed.postgres.js) with `pg` connection pool. | **FIXED** |
| 2 | `docker-compose.yml` had legacy SQLite file mount | Updated [`docker-compose.yml`](file:///c:/Users/rupes/Documents/dhruva/server/docker-compose.yml) to mount `pgvector/pgvector:pg16` container with persistent volume. | **FIXED** |
| 3 | `/health/db` endpoint was missing | Implemented `GET /health/db` and `GET /api/health/db` executing `SELECT 1;`. | **FIXED** |
| 4 | Moderate severity vulnerability in `qs` package | Ran `npm audit fix`, resolving all vulnerabilities (0 vulnerabilities remaining). | **FIXED** |
| 5 | `.gitignore` lacked explicit SQLite database exclusions | Added `*.sqlite`, `*.sqlite3`, `*.db`, `dhruva.sqlite` to root `.gitignore`. | **FIXED** |

---

## 5. Deployment Checklist & Final Gate

- [x] Node.js 22.x compatibility verified
- [x] PostgreSQL & pgvector schema and adapter ready
- [x] All 16 database tables and indexes verified
- [x] Authentication and role-based permissions tested
- [x] Section-aware RAG pipeline and hybrid scoring verified
- [x] Active embargoes database enforcement verified
- [x] Claim verification and audit logging active
- [x] Health check endpoints `/health` and `/health/db` active
- [x] All test suites passing (`npm run backend:check`, `node test_suite.js`)

==================================================  
### FINAL STATUS: READY FOR DEPLOYMENT  
==================================================
