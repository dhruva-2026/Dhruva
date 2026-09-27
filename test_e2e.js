/**
 * DHRUVA FULL-STACK END-TO-END INTEGRATION TEST SUITE
 * Validates real HTTP calls across Frontend API client, Express routes,
 * PostgreSQL database, pgvector similarity, Auth, Papers, RAG, Admin, and Chat.
 */

require('dotenv').config({ path: './server/.env' });

const BASE_URL = 'http://localhost:5000';
let adminToken = '';
let researcherToken = '';
let publicToken = '';

let totalPassed = 0;
let totalFailed = 0;
const results = [];

function record(name, pass, details = '', reason = '') {
  if (pass) {
    console.log(`  ✓ [PASS] ${name}${details ? ' - ' + details : ''}`);
    results.push({ name, status: 'PASS', details });
    totalPassed++;
  } else {
    console.error(`  ✗ [FAIL] ${name} (Reason: ${reason || 'Assertion failed'})`);
    results.push({ name, status: 'FAIL', reason });
    totalFailed++;
  }
}

async function fetchJson(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runE2E() {
  console.log('==============================================================');
  console.log('  DHRUVA FULL-STACK END-TO-END SYSTEM INTEGRATION TEST SUITE  ');
  console.log('==============================================================\n');

  // TEST 1: Health & Database Connectivity
  console.log('[1. Health Check & Live Database Endpoints]');
  try {
    const health = await fetchJson('/health');
    record('GET /health', health.ok && health.data.status === 'ok', `Status: ${health.data.status}`);

    const dbHealth = await fetchJson('/health/db');
    record('GET /health/db', dbHealth.ok && dbHealth.data.database === 'connected', `DB: ${dbHealth.data.engine}`);
  } catch (err) {
    record('GET /health & /health/db', false, '', err.message);
  }

  // TEST 2: Authentication & Role Assignment
  console.log('\n[2. Authentication & Role-Based Tokens]');
  try {
    // Admin login
    const adminLogin = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@dhruva.gov.in', password: 'admin', expectedRole: 'admin' })
    });
    adminToken = adminLogin.data.token;
    record('Admin Login', adminLogin.ok && Boolean(adminToken), `Role: ${adminLogin.data.user?.role}`);

    // Researcher login
    const resLogin = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dr.ananya@ncaor.gov.in', password: 'password', expectedRole: 'researcher' })
    });
    researcherToken = resLogin.data.token;
    record('Researcher Login', resLogin.ok && Boolean(researcherToken), `Role: ${resLogin.data.user?.role}`);

    // Public student login
    const pubLogin = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@dhruva.edu', password: 'password', expectedRole: 'public' })
    });
    publicToken = pubLogin.data.token;
    record('Public User Login', pubLogin.ok && Boolean(publicToken), `Role: ${pubLogin.data.user?.role}`);

    // Test duplicate registration rejection
    const dupReg = await fetchJson('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Duplicate User', email: 'admin@dhruva.gov.in', password: 'password123', role: 'researcher' })
    });
    record('Duplicate Registration Rejection', dupReg.status === 400 || dupReg.status === 409, `HTTP ${dupReg.status}: Duplicate email rejected`);
  } catch (err) {
    record('Authentication flow', false, '', err.message);
  }

  // TEST 3: Role-Based Authorization Boundaries
  console.log('\n[3. Role-Based Access Control Boundaries]');
  try {
    // Public user trying to access admin dashboard
    const pubToAdmin = await fetchJson('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${publicToken}` }
    });
    record('Public -> Admin Blocked', pubToAdmin.status === 403, `HTTP ${pubToAdmin.status} Forbidden`);

    // Public user trying to upload paper
    const pubUpload = await fetchJson('/api/researcher/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${publicToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorized Paper' })
    });
    record('Public -> Researcher Upload Blocked', pubUpload.status === 403, `HTTP ${pubUpload.status} Forbidden`);

    // Admin accessing admin dashboard
    const adminDash = await fetchJson('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    record('Admin -> Admin Dashboard Allowed', adminDash.ok && adminDash.data.metrics !== undefined, `Pending: ${adminDash.data.metrics?.pendingVerification}`);
  } catch (err) {
    record('RBAC Boundaries', false, '', err.message);
  }

  // TEST 4: Papers Discovery & Search API
  console.log('\n[4. Public Papers Discovery & Filters]');
  try {
    // Fetch papers list
    const papersRes = await fetchJson('/api/papers?limit=5');
    record('GET /api/papers (Pagination)', papersRes.ok && papersRes.data.papers?.length > 0, `Returned ${papersRes.data.papers?.length} papers`);

    // Featured papers
    const featuredRes = await fetchJson('/api/papers/featured');
    record('GET /api/papers/featured', featuredRes.ok && featuredRes.data.papers?.length > 0, `Found ${featuredRes.data.papers?.length} featured papers`);

    // Full-text search
    const searchRes = await fetchJson('/api/papers/search?q=Kongsfjorden');
    record('GET /api/papers/search (FTS)', searchRes.ok && searchRes.data.papers?.length > 0, `Matched ${searchRes.data.papers?.length} papers for "Kongsfjorden"`);

    // Filter by polar region
    const antarcticRes = await fetchJson('/api/papers?region=Antarctic');
    const allAntarctic = antarcticRes.data.papers?.every(p => p.polar_region === 'Antarctic');
    record('GET /api/papers?region=Antarctic', antarcticRes.ok && allAntarctic, `Filtered ${antarcticRes.data.papers?.length} Antarctic papers`);
  } catch (err) {
    record('Papers API', false, '', err.message);
  }

  // TEST 5: Paper Deep Details with Structured Sections & AI Outputs
  console.log('\n[5. Paper Deep Inspection & Section Model]');
  try {
    const paperDetail = await fetchJson('/api/papers/paper-006');
    const hasPaper = paperDetail.ok && paperDetail.data.paper?.id === 'paper-006';
    const hasSections = paperDetail.data.sections?.length > 0;
    const hasAIOutput = Boolean(paperDetail.data.aiOutput?.english_summary);
    const hasMCQs = paperDetail.data.mcqs?.length > 0;
    const hasFlashcards = paperDetail.data.flashcards?.length > 0;
    const hasClaims = paperDetail.data.claims?.length > 0;

    record(
      'GET /api/papers/:id (Full Structured Model)',
      hasPaper && hasSections && hasAIOutput && hasMCQs && hasFlashcards && hasClaims,
      `Sections: ${paperDetail.data.sections?.length}, MCQs: ${paperDetail.data.mcqs?.length}, Claims: ${paperDetail.data.claims?.length}`
    );
  } catch (err) {
    record('Paper Detail API', false, '', err.message);
  }

  // TEST 6: RAG Semantic Grounding & Provenance
  console.log('\n[6. Section-Aware RAG Pipeline]');
  try {
    const ragAsk = await fetchJson('/api/rag/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What are the main observations from IndARC in Kongsfjorden?' })
    });

    const hasAnswer = ragAsk.ok && Boolean(ragAsk.data.answer);
    const topSource = ragAsk.data.sources?.[0];
    const hasProvenance = topSource && topSource.paperTitle && topSource.sectionName && topSource.pageNumber > 0;

    record(
      'POST /api/rag/ask (Hybrid RAG + Citations)',
      hasAnswer && hasProvenance,
      `Source: "${topSource?.paperTitle}" (${topSource?.sectionName}, p.${topSource?.pageNumber}, Confidence: ${topSource?.confidenceScore}%)`
    );
  } catch (err) {
    record('RAG Engine API', false, '', err.message);
  }

  // TEST 7: Chat Persistence & Multi-turn History
  console.log('\n[7. Persistent Multi-Turn Chat API]');
  try {
    // 1. Create chat session
    const createSess = await fetchJson('/api/chat/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${publicToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'E2E Test Session' })
    });
    const sessId = createSess.data.session?.id;

    // 2. Send message in session
    const sendMsg = await fetchJson(`/api/chat/sessions/${sessId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${publicToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content: 'Tell me about Maitri station' })
    });

    // 3. Fetch session messages
    const getMsgs = await fetchJson(`/api/chat/sessions/${sessId}/messages`, {
      headers: { Authorization: `Bearer ${publicToken}` }
    });

    // 4. Delete test session
    const delSess = await fetchJson(`/api/chat/sessions/${sessId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${publicToken}` }
    });

    record(
      'Chat Session Lifecycle (Create -> Message -> Retrieve -> Delete)',
      createSess.ok && sendMsg.ok && getMsgs.data.messages?.length === 1 && delSess.ok,
      `Session ID: ${sessId}, Message persisted & retrieved`
    );
  } catch (err) {
    record('Chat API Lifecycle', false, '', err.message);
  }

  // TEST 8: Locations & Media Dissemination
  console.log('\n[8. Locations & Media Portals]');
  try {
    const locs = await fetchJson('/api/locations');
    record('GET /api/locations', locs.ok && locs.data.locations?.length >= 5, `Found ${locs.data.locations?.length} polar research stations`);

    const locDetail = await fetchJson('/api/locations/loc-1');
    record('GET /api/locations/loc-1 (Maitri Station)', locDetail.ok && locDetail.data.location?.name.includes('Maitri'), `Station: ${locDetail.data.location?.name}`);

    const media = await fetchJson('/api/media');
    record('GET /api/media', media.ok && media.data.media?.length >= 5, `Dissemination items: ${media.data.media?.length}`);
  } catch (err) {
    record('Locations & Media API', false, '', err.message);
  }

  // TEST 9: Admin Verification & Decision Workflow
  console.log('\n[9. Admin Review Queue & Claim Verification Workflow]');
  try {
    const queue = await fetchJson('/api/admin/queue', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    record('GET /api/admin/queue', queue.ok && Array.isArray(queue.data.queue), `Queue items: ${queue.data.queue?.length}`);

    // Verify claim decision workflow
    const verifyClaim = await fetchJson('/api/admin/claims/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        claimId: 'clm-001',
        paperId: 'paper-001',
        decision: 'Approved',
        reviewerComment: 'Verified against Section 4 Results.'
      })
    });
    record('POST /api/admin/claims/verify', verifyClaim.ok && verifyClaim.data.decision === 'Approved', `Claim clm-001 approved`);

    // Audit logs fetch
    const auditLogs = await fetchJson('/api/admin/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    record('GET /api/admin/audit-logs', auditLogs.ok && auditLogs.data.logs?.length > 0, `Retrieved ${auditLogs.data.logs?.length} audit log entries`);
  } catch (err) {
    record('Admin Verification Flow', false, '', err.message);
  }

  console.log('\n==============================================================');
  console.log(` E2E TEST SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('==============================================================\n');

  if (totalFailed > 0) {
    console.error('❌ E2E STATUS: FAILURES ENCOUNTERED');
    process.exit(1);
  } else {
    console.log('🎉 FULL STACK STATUS: READY FOR DEPLOYMENT');
    process.exit(0);
  }
}

runE2E();
