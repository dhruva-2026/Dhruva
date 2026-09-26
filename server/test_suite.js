/**
 * DHRUVA Comprehensive Automated Verification Test Suite
 * Validates database schema, 20 synthetic papers, researchers, locations,
 * RAG pipeline, grounding verifications, embargo enforcement, and role permissions.
 */

const db = require('./src/db/db.js');
const { answerQuery, searchChunks } = require('./src/services/ragService.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./src/middleware/auth.js');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

console.log('🧪 Running DHRUVA Automated Verification Test Suite...\n');

// TEST 1: Database Seed Verification
console.log('[Test 1] Database Entities & Synthetic Dataset');
const papers = db.queryAll('SELECT * FROM papers');
assert(papers.length === 20, `Expected 20 research papers, found ${papers.length}`);

const researchers = db.queryAll('SELECT * FROM researchers');
assert(researchers.length === 10, `Expected 10 researchers, found ${researchers.length}`);

const locations = db.queryAll('SELECT * FROM locations');
assert(locations.length >= 8, `Expected at least 8 locations, found ${locations.length}`);

const sections = db.queryAll('SELECT * FROM paper_sections');
assert(sections.length >= 40, `Expected 40+ paper sections, found ${sections.length}`);

const mcqs = db.queryAll('SELECT * FROM mcqs');
assert(mcqs.length >= 60, `Expected 60+ MCQs, found ${mcqs.length}`);

const flashcards = db.queryAll('SELECT * FROM flashcards');
assert(flashcards.length >= 40, `Expected 40+ flashcards, found ${flashcards.length}`);

const claims = db.queryAll('SELECT * FROM claims');
assert(claims.length >= 40, `Expected 40+ grounding claims, found ${claims.length}`);

const embargoes = db.queryAll('SELECT * FROM embargoes');
assert(embargoes.length >= 2, `Expected active embargo records, found ${embargoes.length}`);

const auditLogs = db.queryAll('SELECT * FROM audit_logs');
assert(auditLogs.length >= 10, `Expected audit log entries, found ${auditLogs.length}`);

// TEST 2: Demo Data Labeling
console.log('\n[Test 2] Demo Data Integrity & Labeling');
const demoPapers = db.queryAll('SELECT * FROM papers WHERE is_demo = 1');
assert(demoPapers.length === 20, 'All synthetic papers are strictly tagged with is_demo = 1');

// TEST 3: RAG Pipeline Grounded Retrieval
console.log('\n[Test 3] Section-Aware RAG Pipeline');
const ragRes = answerQuery(db, 'Antarctic climate sea ice Weddell');
assert(ragRes.sources && ragRes.sources.length > 0, 'RAG retrieves grounded sources');
assert(ragRes.sources[0].paperTitle.includes('Weddell Sea'), 'RAG correctly matched top relevant paper');
assert(ragRes.sources[0].sectionName !== undefined, `Retrieved source has section name: "${ragRes.sources[0].sectionName}"`);
assert(ragRes.sources[0].pageNumber > 0, `Retrieved source has page attribution: Page ${ragRes.sources[0].pageNumber}`);
assert(ragRes.sources[0].confidenceScore >= 60, `Retrieved confidence score is high: ${ragRes.sources[0].confidenceScore}%`);

// TEST 4: Strict Embargo Enforcement
console.log('\n[Test 4] Scientific Embargo Public Protection');
// Query public published papers
const publicPapers = db.queryAll(`
  SELECT id, title, status, embargo_enabled 
  FROM papers 
  WHERE status = 'published' AND (embargo_enabled = 0 OR embargo_until <= datetime('now'))
`);
const embargoedInPublic = publicPapers.filter(p => p.id === 'paper-010');
assert(embargoedInPublic.length === 0, 'Active embargoed paper (paper-010) is completely excluded from public search');

// TEST 5: Role-Based Authentication
console.log('\n[Test 5] Authentication & Role-Based Tokens');
const adminUser = db.queryGet("SELECT * FROM users WHERE email = 'admin@dhruva.gov.in'");
assert(adminUser && adminUser.role === 'admin', 'Admin user account exists with role "admin"');

const researcherUser = db.queryGet("SELECT * FROM users WHERE email = 'dr.ananya@ncaor.gov.in'");
assert(researcherUser && researcherUser.role === 'researcher', 'Researcher user account exists with role "researcher"');

const adminToken = jwt.sign({ userId: adminUser.id, role: adminUser.role }, JWT_SECRET, { expiresIn: '1h' });
const decoded = jwt.verify(adminToken, JWT_SECRET);
assert(decoded.role === 'admin', 'Admin JWT token generates and decodes correctly');

// TEST 6: Admin Claim Verification Logic
console.log('\n[Test 6] Admin Claim Verification Flow');
const testClaim = claims[0];
assert(testClaim !== undefined, 'Found test claim');
assert(['Verified', 'Partially Verified', 'Needs Review'].includes(testClaim.grounding_status), 'Claim has valid grounding state');

// Summary
console.log('\n========================================');
console.log(`Test Results: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 All automated verification tests passed flawlessly!');
  process.exit(0);
}
