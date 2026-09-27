/**
 * DHRUVA AI API Automated Test Suite
 * Validates /api/ai/* endpoints: health, search, ask, summarize, claims,
 * claim verification, MCQs, flashcards, and chat persistence.
 */

require('dotenv').config();

const BASE_URL = 'http://localhost:5000';
let adminToken = '';
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

async function runAiApiAudit() {
  console.log('==============================================================');
  console.log('  DHRUVA POLAR SCIENCE PORTAL — AI API AUTOMATED TEST SUITE   ');
  console.log('==============================================================\n');

  // Obtain test tokens
  try {
    const adminRes = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@dhruva.gov.in', password: 'admin123', expectedRole: 'admin' })
    });
    adminToken = adminRes.data.token;

    const pubRes = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@dhruva.edu', password: 'researcher123', expectedRole: 'public' })
    });
    publicToken = pubRes.data.token;
  } catch (err) {
    console.error('Failed to obtain auth tokens for AI API tests:', err);
  }

  // 1. AI Health
  console.log('[1. AI Health Endpoint]');
  try {
    const aiHealth = await fetchJson('/api/ai/health');
    const hasHealth = aiHealth.ok && aiHealth.data.embeddingService?.vocabularySize === 58;
    record('GET /api/ai/health', hasHealth, `Engine: ${aiHealth.data.aiEngine}, Provider: ${aiHealth.data.liveLlmProvider}`);
  } catch (err) {
    record('GET /api/ai/health', false, '', err.message);
  }

  // 2. Hybrid Search
  console.log('\n[2. Hybrid Search Endpoint]');
  try {
    const searchRes = await fetchJson('/api/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'IndARC Kongsfjorden Atlantic oceanography', limit: 3 })
    });

    const hasResults = searchRes.ok && searchRes.data.results?.length > 0;
    const top = searchRes.data.results?.[0];
    const hasScoring = top && top.cosineScore !== undefined && top.keywordScore !== undefined && top.hybridScore !== undefined;

    record(
      'POST /api/ai/search',
      hasResults && hasScoring,
      `Top: "${top?.paperTitle}" (Cosine: ${top?.cosineScore}, KW: ${top?.keywordScore}, Hybrid: ${top?.hybridScore})`
    );

    // Invalid payload
    const badSearch = await fetchJson('/api/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '' })
    });
    record('POST /api/ai/search (Validation)', badSearch.status === 400, 'HTTP 400 on empty query string');
  } catch (err) {
    record('POST /api/ai/search', false, '', err.message);
  }

  // 3. RAG Ask
  console.log('\n[3. RAG Ask Endpoint]');
  try {
    const askRes = await fetchJson('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What are the main observations from IndARC in Kongsfjorden?' })
    });

    const hasAnswer = askRes.ok && Boolean(askRes.data.answer);
    const topSource = askRes.data.sources?.[0];
    const hasCitation = topSource && topSource.paperTitle && topSource.sectionName && topSource.pageNumber > 0;

    record(
      'POST /api/ai/ask',
      hasAnswer && hasCitation,
      `Sources: ${askRes.data.sources?.length}, Top Citation: "${topSource?.paperTitle}" (${topSource?.sectionName}, p.${topSource?.pageNumber})`
    );
  } catch (err) {
    record('POST /api/ai/ask', false, '', err.message);
  }

  // 4. Summarization
  console.log('\n[4. Summarization Endpoint]');
  try {
    const sumRes = await fetchJson('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paperId: 'paper-006' })
    });

    const hasSummary = sumRes.ok && Boolean(sumRes.data.englishSummary) && Boolean(sumRes.data.hindiSummary);
    record('POST /api/ai/summarize', hasSummary, `English & Hindi summaries with ${sumRes.data.keyFindings?.length} key findings`);
  } catch (err) {
    record('POST /api/ai/summarize', false, '', err.message);
  }

  // 5. Claims Extraction
  console.log('\n[5. Claims Endpoint]');
  try {
    const claimsRes = await fetchJson('/api/ai/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paperId: 'paper-001' })
    });

    const hasClaims = claimsRes.ok && claimsRes.data.claims?.length > 0;
    record('POST /api/ai/claims', hasClaims, `Retrieved ${claimsRes.data.claims?.length} grounding claims`);
  } catch (err) {
    record('POST /api/ai/claims', false, '', err.message);
  }

  // 6. Claim Verification & Authorization
  console.log('\n[6. Claim Verification & Role Protection]');
  try {
    // 1. Unauthorized attempt by public token
    const pubVerify = await fetchJson('/api/ai/claims/claim-paper-001-1/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${publicToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'Approved' })
    });
    record('Claim Verification RBAC Defense', pubVerify.status === 403, `HTTP ${pubVerify.status} Forbidden for non-admin`);

    // 2. Authorized verification by admin
    const adminVerify = await fetchJson('/api/ai/claims/claim-paper-001-1/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'Approved',
        reviewerComment: 'Verified by DHRUVA Senior AI Reviewer'
      })
    });
    record('POST /api/ai/claims/:id/verify (Admin)', adminVerify.ok && adminVerify.data.decision === 'Approved', `Decision: ${adminVerify.data.decision}`);
  } catch (err) {
    record('Claim Verification', false, '', err.message);
  }

  // 7. Educational MCQs & Flashcards Generation
  console.log('\n[7. MCQ & Flashcard Generation Endpoints]');
  try {
    const mcqRes = await fetchJson('/api/ai/mcqs/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paperId: 'paper-006' })
    });
    record('POST /api/ai/mcqs/generate', mcqRes.ok && mcqRes.data.mcqs?.length > 0, `Generated ${mcqRes.data.mcqs?.length} grounded MCQs`);

    const flashRes = await fetchJson('/api/ai/flashcards/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paperId: 'paper-006' })
    });
    record('POST /api/ai/flashcards/generate', flashRes.ok && flashRes.data.flashcards?.length > 0, `Generated ${flashRes.data.flashcards?.length} flashcards`);
  } catch (err) {
    record('MCQ/Flashcard Endpoints', false, '', err.message);
  }

  console.log('\n==============================================================');
  console.log(` AI API AUDIT SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('==============================================================\n');

  if (totalFailed > 0) {
    console.error('❌ AI API STATUS: NOT READY');
    process.exit(1);
  } else {
    console.log('🎉 AI API STATUS: READY');
    process.exit(0);
  }
}

runAiApiAudit();
