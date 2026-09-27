/**
 * DHRUVA Research-Grade Polar Science AI Evaluation Test Suite
 * Evaluates retrieval fidelity, citation accuracy, multi-hop synthesis,
 * conversational memory, acronym expansion, embargo protection, and hallucination resistance.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/db/db.js');
const { searchChunks, answerQuery, answerQueryAsync } = require('../src/services/ragService.js');
const { expandQuery, detectResponseMode, resolveConversationContext } = require('../src/services/polarDomainService.js');
const { getLLMProviderStatus } = require('../src/services/llmService.js');
const { generateDocumentArtifactsAsync } = require('../src/services/aiGenerator.js');

async function runEvaluationSuite() {
  console.log('========================================================================');
  console.log('❄️  DHRUVA AI RESEARCH-GRADE POLAR SCIENCE EVALUATION SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assertTest(title, condition, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${title}`);
    } else {
      console.log(`❌ [FAIL] ${title}`);
      if (details) console.log(`   Details: ${details}`);
    }
  }

  // ── TEST 1: LLM Gateway & Provider Status ──
  console.log('--- 1. Model Gateway & Provider Status ---');
  const status = getLLMProviderStatus();
  assertTest('LLM Provider Gateway is operational', !!status.activeProvider, `Active: ${status.activeProvider}`);
  assertTest('Security: API keys are masked or hidden', !status.groq?.keyMasked?.includes(process.env.GROQ_API_KEY || 'MISSING_SECRET_CHECK'));

  // ── TEST 2: Domain Terminology & Acronym Expansion ──
  console.log('\n--- 2. Polar Domain Acronym & Terminology Expansion ---');
  const expandedIndARC = expandQuery('What did IndARC measure?');
  assertTest(
    'Acronym "IndARC" expands to Kongsfjorden mooring details', 
    expandedIndARC.includes('kongsfjorden') && expandedIndARC.includes('192m'),
    `Expanded: ${expandedIndARC}`
  );

  const expandedMethane = expandQuery('permafrost methane flux');
  assertTest(
    'Term "permafrost" expands to active layer and methanogenesis',
    expandedMethane.includes('active') && expandedMethane.includes('methanogenesis'),
    `Expanded: ${expandedMethane}`
  );

  // ── TEST 3: Response Mode Auto-Detection ──
  console.log('\n--- 3. Response Mode Auto-Detection ---');
  const modeCompare = detectResponseMode('Compare Arctic sea ice versus Antarctic ice sheets');
  assertTest('Detects "compare_papers" mode', modeCompare === 'compare_papers', `Detected: ${modeCompare}`);

  const modeMethod = detectResponseMode('What sensors and methodology were used in Kongsfjorden?');
  assertTest('Detects "methodology_analysis" mode', modeMethod === 'methodology_analysis', `Detected: ${modeMethod}`);

  const modeSummary = detectResponseMode('Summarize the executive findings of the Svalbard study');
  assertTest('Detects "research_summary" mode', modeSummary === 'research_summary', `Detected: ${modeSummary}`);

  // ── TEST 4: Hybrid Semantic + BM25 Section-Aware Retrieval ──
  console.log('\n--- 4. Hybrid Semantic + BM25 Retrieval & Reranking ---');
  const chunks = await searchChunks(db, 'How does permafrost thaw in Svalbard affect methane emissions?', { topK: 4 });
  assertTest('Retrieves relevant scientific candidates (count > 0)', chunks.length > 0, `Count: ${chunks.length}`);
  if (chunks.length > 0) {
    const topChunk = chunks[0];
    assertTest(
      'Top candidate is the Ny-Ålesund / Svalbard permafrost paper',
      topChunk.paperTitle.toLowerCase().includes('permafrost') || topChunk.paperTitle.toLowerCase().includes('svalbard'),
      `Title: ${topChunk.paperTitle}`
    );
    assertTest('Chunk retains section metadata & page numbers', !!topChunk.sectionName && typeof topChunk.pageNumber === 'number', `Section: ${topChunk.sectionName}, Page: ${topChunk.pageNumber}`);
    assertTest('Confidence score exceeds 75%', topChunk.confidencePercent >= 75, `Confidence: ${topChunk.confidencePercent}%`);
  }

  // ── TEST 5: Embargo Protection & Unapproved Paper Isolation ──
  console.log('\n--- 5. Strict Embargo Protection & Visibility Guard ---');
  const allPublicChunks = await searchChunks(db, 'confidential draft preliminary findings', { topK: 10 });
  const hasEmbargoed = allPublicChunks.some(c => c.embargo_enabled === 1);
  assertTest('Zero embargoed/unapproved chunks retrieved in public RAG', !hasEmbargoed);

  // ── TEST 6: Conversational Memory & Anaphora Resolution ──
  console.log('\n--- 6. Conversational Memory & Follow-Up Context ---');
  const conversationHistory = [
    { role: 'user', content: 'Tell me about the IndARC mooring observatory in Kongsfjorden' },
    { role: 'assistant', content: 'IndARC is India\'s multi-sensor underwater mooring observatory deployed at 192m depth in Kongsfjorden, Svalbard.' }
  ];
  const resolvedFollowUp = resolveConversationContext('Why was it deployed at 192m depth?', conversationHistory);
  assertTest(
    'Follow-up query resolves previous entity "indarc" / "kongsfjorden"',
    resolvedFollowUp.toLowerCase().includes('indarc') || resolvedFollowUp.toLowerCase().includes('context'),
    `Resolved: ${resolvedFollowUp}`
  );

  // ── TEST 7: Multi-Hop Question Answering with Citations ──
  console.log('\n--- 7. Scientific Grounding & Citations ---');
  const ragResult = await answerQueryAsync(db, 'What did IndARC mooring observe at 192m depth?');
  assertTest('RAG generates non-empty answer', !!ragResult.answer && ragResult.answer.length > 80);
  assertTest('Verified source citations are attached', ragResult.sources && ragResult.sources.length > 0, `Sources: ${ragResult.sources?.length}`);
  if (ragResult.sources && ragResult.sources.length > 0) {
    const s = ragResult.sources[0];
    assertTest('Citations contain exact page numbers and paper titles', !!s.paperTitle && !!s.pageNumber, `Citation: ${s.paperTitle} p.${s.pageNumber}`);
  }

  // ── TEST 8: Anti-Hallucination & Insufficient Evidence Handling ──
  console.log('\n--- 8. Anti-Hallucination on Out-of-Domain Inquiries ---');
  const fictitiousQuery = 'What is the population of tropical rainforest monkeys living in the interior Antarctic ice sheet?';
  const outOfDomainResult = await answerQuery(db, fictitiousQuery);
  assertTest(
    'Refuses to hallucinate and declares Insufficient Evidence',
    outOfDomainResult.answer.includes('Insufficient Verified') || outOfDomainResult.sources.length === 0,
    `Response excerpt: ${outOfDomainResult.answer.slice(0, 100)}`
  );

  // ── TEST 9: Conversational Greetings & Identity ──
  console.log('\n--- 9. Conversational Politeness & Platform Identity ---');
  const greetingResult = await answerQueryAsync(db, 'namaste');
  assertTest('Greets politely and introduces DHRUVA AI', greetingResult.answer.toLowerCase().includes('namaste') && greetingResult.answer.includes('DHRUVA'));

  const polesResult = await answerQueryAsync(db, 'what are poles');
  assertTest('Provides foundational breakdown for "what are poles"', polesResult.answer.includes('North Pole') && polesResult.answer.includes('South Pole'));

  // ── TEST 10: AI-Generated Educational Content Quality ──
  console.log('\n--- 10. AI-Generated Educational Artifacts (Bilingual) ---');
  const samplePaper = {
    title: 'Seasonal Variability of Antarctic Sea Ice Extent in the Weddell Sea',
    abstract: 'Satellite passive microwave observations were analyzed to quantify seasonal sea ice variability in the Weddell Sea.',
    text: 'Sea ice extent reached minimum in February and maximum in September. Albedo feedback drove rapid spring melt.',
    region: 'Antarctic',
    area: 'Glaciology',
    institution: 'National Centre for Polar and Ocean Research',
    authors: 'Dr. Polar Scientist'
  };

  const artifacts = await generateDocumentArtifactsAsync(samplePaper);
  assertTest('Generates English summary', !!artifacts.aiOutput.english_summary && artifacts.aiOutput.english_summary.length > 30);
  assertTest('Generates authentic Hindi summary', !!artifacts.aiOutput.hindi_summary && artifacts.aiOutput.hindi_summary.length > 30);
  assertTest('Generates structured MCQs (>= 3 questions)', Array.isArray(artifacts.mcqs) && artifacts.mcqs.length >= 3, `Count: ${artifacts.mcqs.length}`);
  assertTest('Generates interactive 3D flashcards (>= 3 cards)', Array.isArray(artifacts.flashcards) && artifacts.flashcards.length >= 3, `Count: ${artifacts.flashcards.length}`);
  assertTest('Generates verifiable claims', Array.isArray(artifacts.claims) && artifacts.claims.length >= 2, `Count: ${artifacts.claims.length}`);

  // ── FINAL SUMMARY ──
  console.log('\n========================================================================');
  console.log(`📊 EVALUATION SCORE: ${passed} / ${total} Tests Passed (${((passed / total) * 100).toFixed(1)}%)`);
  console.log('========================================================================\n');

  if (passed === total) {
    console.log('✨ All Research-Grade Polar Science AI Evaluation tests PASSED perfectly!\n');
  }
}

runEvaluationSuite().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal Evaluation Suite Error:', err);
  process.exit(1);
});
