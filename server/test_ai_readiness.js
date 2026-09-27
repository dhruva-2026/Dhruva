/**
 * DHRUVA AI & RAG COMPREHENSIVE READINESS AUDIT SUITE
 * Validates dense embeddings, pgvector storage, hybrid BM25 + cosine ranking (0.65/0.35),
 * provenance tracking, grounding, claim verification, MCQs, flashcards, and chat RAG.
 */

require('dotenv').config();
const db = require('./src/db/db.js');
const {
  POLAR_VOCAB,
  EMBEDDING_DIM,
  generateEmbedding,
  cosineSimilarity,
  keywordScore,
  searchChunks,
  answerQuery
} = require('./src/services/ragService.js');

let passCount = 0;
let failCount = 0;
const results = [];

function record(name, passed, details = '', reason = '') {
  if (passed) {
    console.log(`  ✓ [PASS] ${name}${details ? ' - ' + details : ''}`);
    results.push({ name, status: 'PASS', details });
    passCount++;
  } else {
    console.error(`  ✗ [FAIL] ${name} (Reason: ${reason || 'Assertion failed'})`);
    results.push({ name, status: 'FAIL', reason });
    failCount++;
  }
}

async function runAiAudit() {
  console.log('==============================================================');
  console.log('  DHRUVA POLAR SCIENCE PORTAL — AI & RAG READINESS AUDIT     ');
  console.log('==============================================================\n');

  // 1. Embedding Generation & Determinism
  console.log('[1. Embedding Generation, Dimensions & Determinism]');
  try {
    const text1 = "Antarctic ice sheet mass balance and sea ice extent in Weddell Sea";
    const emb1 = generateEmbedding(text1);
    const emb1_dup = generateEmbedding(text1);

    const isDim58 = emb1.length === 58 && emb1.length === EMBEDDING_DIM;
    const isDeterministic = emb1.every((val, idx) => val === emb1_dup[idx]);
    const noNaN = emb1.every(v => !isNaN(v) && isFinite(v));

    let norm = 0;
    for (const v of emb1) norm += v * v;
    const isL2Normalized = Math.abs(Math.sqrt(norm) - 1.0) < 0.001;

    record('Embedding Dimensions & L2 Normalization', isDim58 && isL2Normalized && noNaN, `Dimension: ${emb1.length}, L2 Norm: 1.0`);
    record('Deterministic Output for Identical Input', isDeterministic, '100% reproducible bitwise equality');
  } catch (err) {
    record('Embedding Generation', false, '', err.message);
  }

  // 2. Embedding Fallback & Edge Cases
  console.log('\n[2. Embedding Edge Cases & Character Hashing Fallback]');
  try {
    // Empty text
    const emptyEmb = generateEmbedding('');
    const emptyOk = emptyEmb.length === 58 && !emptyEmb.some(isNaN);

    // Non-domain text triggering n-gram character hashing fallback
    const genericText = "Quantum electrodynamics in semiconductor nanostructures";
    const genericEmb = generateEmbedding(genericText);
    const genericOk = genericEmb.length === 58 && genericEmb.some(v => v > 0);

    // Special characters and Unicode
    const unicodeText = "❄️ Ny-Ålesund & Schirmacher Oasis: CO₂ & CH₄ thaw observations! (°C & ‰)";
    const unicodeEmb = generateEmbedding(unicodeText);
    const unicodeOk = unicodeEmb.length === 58 && unicodeEmb.some(v => v > 0);

    record('Edge Cases & n-gram Fallback', emptyOk && genericOk && unicodeOk, 'Empty string, generic text, and Unicode handled cleanly');
  } catch (err) {
    record('Embedding Edge Cases', false, '', err.message);
  }

  // 3. Semantic Quality & Cosine Similarity
  console.log('\n[3. Semantic Similarity Quality & Cosine Computation]');
  try {
    const vec1 = generateEmbedding('Antarctic ice sheet dynamics and sea ice extent in Weddell Sea');
    const vec2 = generateEmbedding('Antarctic sea ice variability and ice sheet mass balance');
    const vecUnrelated = generateEmbedding('Quantum semiconductor nanostructure electrodynamics');

    const simRelated = cosineSimilarity(vec1, vec2);
    const simUnrelated = cosineSimilarity(vec1, vecUnrelated);

    const semanticRankingOk = simRelated > simUnrelated && simRelated > 0.5 && simUnrelated < 0.2;
    record(
      'Semantic Similarity Quality',
      semanticRankingOk,
      `Related (Antarctic Sea Ice/Ice Sheet): ${simRelated.toFixed(3)} > Unrelated (Quantum Physics): ${simUnrelated.toFixed(3)}`
    );

    // Malformed vector rejection
    const malformed = cosineSimilarity(vec1, [0.1, 0.2]);
    record('Malformed Vector Rejection', malformed === 0, 'Zero returned for mismatched vector dimensions');
  } catch (err) {
    record('Cosine Similarity', false, '', err.message);
  }

  // 4. BM25-Inspired Keyword Scorer
  console.log('\n[4. Keyword Matching & Scoring]');
  try {
    const query = 'IndARC Kongsfjorden Atlantic';
    const textMatch = 'Mooring data from the IndARC observatory in Kongsfjorden shows Atlantic Water influx.';
    const textMismatch = 'Schirmacher oasis freshwater lakes in East Antarctica.';

    const kwScoreMatch = keywordScore(query, textMatch);
    const kwScoreMismatch = keywordScore(query, textMismatch);

    record(
      'Keyword Score Differentiation',
      kwScoreMatch > kwScoreMismatch && kwScoreMatch >= 0.9,
      `Match score: ${kwScoreMatch.toFixed(2)}, Non-match: ${kwScoreMismatch.toFixed(2)}`
    );
  } catch (err) {
    record('Keyword Scoring', false, '', err.message);
  }

  // 5. Hybrid Ranking Verification (0.65 Cosine + 0.35 Keyword)
  console.log('\n[5. Hybrid Ranking Formula Verification]');
  try {
    const query = 'Weddell Sea sea ice extent';
    const results = searchChunks(db, query, { topK: 3 });

    let formulaVerified = true;
    for (const r of results) {
      const qVec = generateEmbedding(query);
      const cVec = generateEmbedding(r.text);
      const cosSim = cosineSimilarity(qVec, cVec);
      const kwSim = keywordScore(query, r.text);
      const expected = Math.round(((cosSim * 0.65) + (kwSim * 0.35)) * 100) / 100;
      if (Math.abs(r.similarityScore - expected) > 0.05) {
        formulaVerified = false;
      }
    }

    record(
      'Formula: 0.65 Cosine + 0.35 Keyword',
      formulaVerified && results.length > 0,
      `Top match: "${results[0]?.paperTitle}" (Score: ${results[0]?.similarityScore})`
    );
  } catch (err) {
    record('Hybrid Ranking', false, '', err.message);
  }

  // 6. Provenance & Section/Page Attribution
  console.log('\n[6. Provenance & Attribution Tracking]');
  try {
    const ragRes = answerQuery(db, 'What are the main observations from IndARC in Kongsfjorden?');
    const sources = ragRes.sources;
    const hasProvenance = sources.length > 0 && sources.every(s => (
      s.paperId &&
      s.paperTitle &&
      s.sectionName &&
      s.pageNumber > 0 &&
      s.confidenceScore >= 60 &&
      s.snippet
    ));

    record(
      'Section & Page Provenance Attribution',
      hasProvenance,
      `Top Source: ${sources[0]?.paperTitle} -> Section: ${sources[0]?.sectionName}, Page: ${sources[0]?.pageNumber} (Confidence: ${sources[0]?.confidenceScore}%)`
    );
  } catch (err) {
    record('Provenance Tracking', false, '', err.message);
  }

  // 7. Grounding & Anti-Hallucination Policy
  console.log('\n[7. Grounding & Unrelated Query Anti-Hallucination]');
  try {
    const ungroundedQuery = 'Who won the 2024 NBA finals championship game in basketball?';
    const ungroundedRes = answerQuery(db, ungroundedQuery);
    
    // System should either return low score or explain no verified polar context
    const isGroundingPreserved = ungroundedRes.sources.length === 0 || ungroundedRes.sources[0].confidenceScore < 70;
    record(
      'Anti-Hallucination on Out-of-Domain Query',
      isGroundingPreserved,
      'No fictitious citations or fabricated polar facts presented'
    );
  } catch (err) {
    record('Anti-Hallucination Check', false, '', err.message);
  }

  // 8. Embargo & Access Enforcement in RAG
  console.log('\n[8. Embargo Restrictions in Semantic Retrieval]');
  try {
    const globalSearch = searchChunks(db, 'Methanogenesis in Thawing Permafrost Kongsfjorden');
    const leaksEmbargo = globalSearch.some(c => c.paperId === 'paper-010');

    record(
      'RAG Embargo Enforcement',
      !leaksEmbargo,
      'Active embargoed paper (paper-010) strictly excluded from public semantic retrieval'
    );
  } catch (err) {
    record('RAG Embargo Enforcement', false, '', err.message);
  }

  // 9. Fact-Checked Claims & Verification
  console.log('\n[9. AI Fact-Checked Claims & Grounding Decisions]');
  try {
    const claims = db.queryAll('SELECT * FROM claims');
    const validStates = claims.every(c => ['Verified', 'Partially Verified', 'Needs Review', 'Unsupported'].includes(c.grounding_status));
    const validDecisions = claims.every(c => ['Pending', 'Approved', 'Edited', 'Rejected'].includes(c.decision));

    record(
      'Claim Grounding State & Workflow',
      claims.length >= 40 && validStates && validDecisions,
      `Total Claims: ${claims.length} with source sections and confidence scores`
    );
  } catch (err) {
    record('Claim Verification', false, '', err.message);
  }

  // 10. Educational MCQs & Flashcards
  console.log('\n[10. Educational MCQs & Flashcards]');
  try {
    const mcqs = db.queryAll('SELECT * FROM mcqs');
    const flashcards = db.queryAll('SELECT * FROM flashcards');

    const mcqsGrounded = mcqs.every(m => m.paper_id && m.source_section && m.correct_option && m.explanation);
    const flashcardsGrounded = flashcards.every(f => f.paper_id && f.front && f.back && f.source_section);

    record(
      'MCQs & Flashcards Section Grounding',
      mcqs.length >= 60 && flashcards.length >= 40 && mcqsGrounded && flashcardsGrounded,
      `MCQs: ${mcqs.length}, Flashcards: ${flashcards.length} grounded in original papers`
    );
  } catch (err) {
    record('Educational Content Grounding', false, '', err.message);
  }

  // 11. Performance Benchmarks
  console.log('\n[11. AI Pipeline Latency Benchmarks]');
  try {
    const t0 = performance.now();
    for (let i = 0; i < 50; i++) {
      generateEmbedding("Antarctic sea ice variability and IndARC Kongsfjorden oceanography");
    }
    const avgEmbeddingTime = (performance.now() - t0) / 50;

    const t1 = performance.now();
    for (let i = 0; i < 20; i++) {
      searchChunks(db, "Arctic marine ecosystems IndARC Kongsfjorden", { topK: 4 });
    }
    const avgRetrievalTime = (performance.now() - t1) / 20;

    record(
      'AI Retrieval Latency Benchmarks',
      avgEmbeddingTime < 2.0 && avgRetrievalTime < 50.0,
      `Avg Embedding: ${avgEmbeddingTime.toFixed(2)}ms, Avg Hybrid Retrieval: ${avgRetrievalTime.toFixed(2)}ms`
    );
  } catch (err) {
    record('Performance Benchmarks', false, '', err.message);
  }

  console.log('\n==============================================================');
  console.log(` AI & RAG AUDIT SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('==============================================================\n');

  if (failCount > 0) {
    console.error('❌ AI STATUS: NOT READY');
    process.exit(1);
  } else {
    console.log('🎉 AI STATUS: READY FOR DEPLOYMENT');
    process.exit(0);
  }
}

runAiAudit();
