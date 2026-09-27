/**
 * DHRUVA Database Migration Script: SQLite -> PostgreSQL + pgvector
 * Extracts all relational tables, structured document sections,
 * claims, MCQs, and converts embeddings to PostgreSQL vector(58).
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const pg = require('./postgres.js');

async function migrateSqliteToPostgres() {
  console.log('🔄 Initiating DHRUVA SQLite to PostgreSQL Migration Pipeline...\n');

  const sqlitePath = path.join(__dirname, '..', '..', 'dhruva.sqlite');
  if (!fs.existsSync(sqlitePath)) {
    console.error('❌ SQLite source database not found at:', sqlitePath);
    return { success: false, error: 'Source SQLite file missing' };
  }

  const sqlite = new DatabaseSync(sqlitePath);
  const tables = [
    'users',
    'locations',
    'researchers',
    'papers',
    'paper_sections',
    'paper_chunks',
    'ai_outputs',
    'mcqs',
    'flashcards',
    'claims',
    'verifications',
    'embargoes',
    'media',
    'audit_logs',
    'chat_sessions',
    'chat_messages'
  ];

  const migrationStats = {};

  try {
    // 1. Initialize PostgreSQL schema
    await pg.initPostgresSchema();

    // 2. Clear destination tables in reverse foreign-key order
    await pg.execRaw(`
      DELETE FROM verifications;
      DELETE FROM claims;
      DELETE FROM mcqs;
      DELETE FROM flashcards;
      DELETE FROM ai_outputs;
      DELETE FROM paper_chunks;
      DELETE FROM paper_sections;
      DELETE FROM embargoes;
      DELETE FROM media;
      DELETE FROM audit_logs;
      DELETE FROM papers;
      DELETE FROM researchers;
      DELETE FROM locations;
      DELETE FROM chat_messages;
      DELETE FROM chat_sessions;
      DELETE FROM users;
    `);

    // 3. Migrate Users
    const users = sqlite.prepare('SELECT * FROM users').all();
    for (const u of users) {
      await pg.execute(
        `INSERT INTO users (id, name, email, password_hash, role, institution, avatar_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [u.id, u.name, u.email, u.password_hash, u.role, u.institution, u.avatar_url, u.created_at]
      );
    }
    migrationStats.users = { sqlite: users.length, postgres: (await pg.queryAll('SELECT * FROM users')).length };

    // 4. Migrate Locations
    const locations = sqlite.prepare('SELECT * FROM locations').all();
    for (const l of locations) {
      await pg.execute(
        `INSERT INTO locations (id, name, region, latitude, longitude, country, description, station_type, established_year, status, thumbnail_url, is_demo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [l.id, l.name, l.region, l.latitude, l.longitude, l.country, l.description, l.station_type, l.established_year, l.status, l.thumbnail_url, l.is_demo]
      );
    }
    migrationStats.locations = { sqlite: locations.length, postgres: (await pg.queryAll('SELECT * FROM locations')).length };

    // 5. Migrate Researchers
    const researchers = sqlite.prepare('SELECT * FROM researchers').all();
    for (const r of researchers) {
      await pg.execute(
        `INSERT INTO researchers (id, user_id, name, email, institution, designation, research_area, polar_region, bio, avatar, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [r.id, r.user_id, r.name, r.email, r.institution, r.designation, r.research_area, r.polar_region, r.bio, r.avatar, r.created_at]
      );
    }
    migrationStats.researchers = { sqlite: researchers.length, postgres: (await pg.queryAll('SELECT * FROM researchers')).length };

    // 6. Migrate Papers
    const papers = sqlite.prepare('SELECT * FROM papers').all();
    for (const p of papers) {
      await pg.execute(
        `INSERT INTO papers (id, title, abstract, authors, institution, research_area, polar_region, location_id, keywords, publication_year, doi, document_url, thumbnail_url, status, visibility, embargo_enabled, embargo_until, uploaded_by, rejection_reason, admin_comment, view_count, download_count, is_demo, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`,
        [p.id, p.title, p.abstract, p.authors, p.institution, p.research_area, p.polar_region, p.location_id, p.keywords, p.publication_year, p.doi, p.document_url, p.thumbnail_url, p.status, p.visibility, p.embargo_enabled, p.embargo_until, p.uploaded_by, p.rejection_reason, p.admin_comment, p.view_count, p.download_count, p.is_demo, p.created_at, p.updated_at]
      );
    }
    migrationStats.papers = { sqlite: papers.length, postgres: (await pg.queryAll('SELECT * FROM papers')).length };

    // 7. Migrate Paper Sections
    const sections = sqlite.prepare('SELECT * FROM paper_sections').all();
    for (const s of sections) {
      await pg.execute(
        `INSERT INTO paper_sections (id, paper_id, section_name, section_order, content, page_start, page_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [s.id, s.paper_id, s.section_name, s.section_order, s.content, s.page_start, s.page_end]
      );
    }
    migrationStats.paper_sections = { sqlite: sections.length, postgres: (await pg.queryAll('SELECT * FROM paper_sections')).length };

    // 8. Migrate Paper Chunks & Convert Embeddings to pgvector
    const chunks = sqlite.prepare('SELECT * FROM paper_chunks').all();
    for (const c of chunks) {
      let vectorStr = null;
      if (c.embedding_json) {
        try {
          const parsed = JSON.parse(c.embedding_json);
          if (Array.isArray(parsed) && parsed.length === 58) {
            vectorStr = `[${parsed.join(',')}]`;
          }
        } catch (e) {}
      }

      await pg.execute(
        `INSERT INTO paper_chunks (id, paper_id, section_id, section_name, chunk_index, text, page_number, embedding, embedding_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, $9)`,
        [c.id, c.paper_id, c.section_id, c.section_name, c.chunk_index, c.text, c.page_number, vectorStr, c.embedding_json]
      );
    }
    migrationStats.paper_chunks = { sqlite: chunks.length, postgres: (await pg.queryAll('SELECT * FROM paper_chunks')).length };

    // 9. Migrate AI Outputs
    const aiOutputs = sqlite.prepare('SELECT * FROM ai_outputs').all();
    for (const a of aiOutputs) {
      await pg.execute(
        `INSERT INTO ai_outputs (id, paper_id, english_summary, hindi_summary, key_findings, important_terms, why_it_matters, social_media_draft, citation_text, generated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [a.id, a.paper_id, a.english_summary, a.hindi_summary, a.key_findings, a.important_terms, a.why_it_matters, a.social_media_draft, a.citation_text, a.generated_at]
      );
    }
    migrationStats.ai_outputs = { sqlite: aiOutputs.length, postgres: (await pg.queryAll('SELECT * FROM ai_outputs')).length };

    // 10. Migrate MCQs
    const mcqs = sqlite.prepare('SELECT * FROM mcqs').all();
    for (const m of mcqs) {
      await pg.execute(
        `INSERT INTO mcqs (id, paper_id, question, option_a, option_b, option_c, option_d, correct_option, explanation, source_section, source_page)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [m.id, m.paper_id, m.question, m.option_a, m.option_b, m.option_c, m.option_d, m.correct_option, m.explanation, m.source_section, m.source_page]
      );
    }
    migrationStats.mcqs = { sqlite: mcqs.length, postgres: (await pg.queryAll('SELECT * FROM mcqs')).length };

    // 11. Migrate Flashcards
    const flashcards = sqlite.prepare('SELECT * FROM flashcards').all();
    for (const f of flashcards) {
      await pg.execute(
        `INSERT INTO flashcards (id, paper_id, front, back, source_section)
         VALUES ($1, $2, $3, $4, $5)`,
        [f.id, f.paper_id, f.front, f.back, f.source_section]
      );
    }
    migrationStats.flashcards = { sqlite: flashcards.length, postgres: (await pg.queryAll('SELECT * FROM flashcards')).length };

    // 12. Migrate Claims
    const claims = sqlite.prepare('SELECT * FROM claims').all();
    for (const cl of claims) {
      await pg.execute(
        `INSERT INTO claims (id, paper_id, generated_claim, source_text, source_section, source_page, confidence_score, grounding_status, decision)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [cl.id, cl.paper_id, cl.generated_claim, cl.source_text, cl.source_section, cl.source_page, cl.confidence_score, cl.grounding_status, cl.decision]
      );
    }
    migrationStats.claims = { sqlite: claims.length, postgres: (await pg.queryAll('SELECT * FROM claims')).length };

    // 13. Migrate Verifications
    const verifications = sqlite.prepare('SELECT * FROM verifications').all();
    for (const v of verifications) {
      await pg.execute(
        `INSERT INTO verifications (id, claim_id, paper_id, reviewer_id, reviewer_comment, decision, verified_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [v.id, v.claim_id, v.paper_id, v.reviewer_id, v.reviewer_comment, v.decision, v.verified_at]
      );
    }
    migrationStats.verifications = { sqlite: verifications.length, postgres: (await pg.queryAll('SELECT * FROM verifications')).length };

    // 14. Migrate Embargoes
    const embargoes = sqlite.prepare('SELECT * FROM embargoes').all();
    for (const e of embargoes) {
      await pg.execute(
        `INSERT INTO embargoes (id, paper_id, embargo_enabled, embargo_until, reason, approved_by, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [e.id, e.paper_id, e.embargo_enabled, e.embargo_until, e.reason, e.approved_by, e.status, e.created_at, e.updated_at]
      );
    }
    migrationStats.embargoes = { sqlite: embargoes.length, postgres: (await pg.queryAll('SELECT * FROM embargoes')).length };

    // 15. Migrate Media
    const media = sqlite.prepare('SELECT * FROM media').all();
    for (const md of media) {
      await pg.execute(
        `INSERT INTO media (id, title, type, description, thumbnail_url, media_url, region, location_id, related_paper_id, publication_date, status, is_demo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [md.id, md.title, md.type, md.description, md.thumbnail_url, md.media_url, md.region, md.location_id, md.related_paper_id, md.publication_date, md.status, md.is_demo]
      );
    }
    migrationStats.media = { sqlite: media.length, postgres: (await pg.queryAll('SELECT * FROM media')).length };

    // 16. Migrate Audit Logs
    const auditLogs = sqlite.prepare('SELECT * FROM audit_logs').all();
    for (const a of auditLogs) {
      await pg.execute(
        `INSERT INTO audit_logs (id, actor, role, action, paper_id, timestamp, previous_value, new_value, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [a.id, a.actor, a.role, a.action, a.paper_id, a.timestamp, a.previous_value, a.new_value, a.details]
      );
    }
    migrationStats.audit_logs = { sqlite: auditLogs.length, postgres: (await pg.queryAll('SELECT * FROM audit_logs')).length };

    // 17. Migrate Chat Sessions & Messages
    const chatSessions = sqlite.prepare('SELECT * FROM chat_sessions').all();
    for (const cs of chatSessions) {
      await pg.execute(
        `INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [cs.id, cs.user_id, cs.title, cs.created_at, cs.updated_at]
      );
    }
    migrationStats.chat_sessions = { sqlite: chatSessions.length, postgres: (await pg.queryAll('SELECT * FROM chat_sessions')).length };

    const chatMessages = sqlite.prepare('SELECT * FROM chat_messages').all();
    for (const cm of chatMessages) {
      await pg.execute(
        `INSERT INTO chat_messages (id, session_id, role, content, sources_json, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [cm.id, cm.session_id, cm.role, cm.content, cm.sources_json, cm.created_at]
      );
    }
    migrationStats.chat_messages = { sqlite: chatMessages.length, postgres: (await pg.queryAll('SELECT * FROM chat_messages')).length };

    console.log('✅ Migration to PostgreSQL completed successfully!\n');
    console.table(migrationStats);
    return { success: true, stats: migrationStats };
  } catch (err) {
    console.error('❌ Migration error:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { migrateSqliteToPostgres };
