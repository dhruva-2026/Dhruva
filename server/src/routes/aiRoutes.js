/**
 * Dedicated AI & RAG Router for DHRUVA Platform
 * Implements /api/ai/health, /api/ai/search, /api/ai/ask, /api/ai/summarize,
 * /api/ai/claims, /api/ai/claims/:id/verify, /api/ai/mcqs/generate, /api/ai/flashcards/generate
 */

const express = require('express');
const router = express.Router();
const db = require('../db/db.js');
const {
  POLAR_VOCAB,
  EMBEDDING_DIM,
  generateEmbedding,
  cosineSimilarity,
  keywordScore,
  searchChunks,
  answerQuery,
  answerQueryAsync
} = require('../services/ragService.js');
const { requireRole, requireAuth } = require('../middleware/auth.js');

// 1. GET /api/ai/health - AI Subsystem Status & Dependencies
router.get('/health', async (req, res) => {
  const dbHealth = await db.checkHealth();
  const hasGroq = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());

  res.json({
    status: 'ok',
    aiEngine: 'DHRUVA Section-Aware Polar RAG',
    embeddingService: {
      status: 'active',
      vocabularySize: POLAR_VOCAB.length,
      vectorDimension: EMBEDDING_DIM,
      normalization: 'L2 Unit Normalization',
      fallback: '3-gram Character Hashing'
    },
    scoringFormula: '0.65 * Cosine Similarity + 0.35 * Keyword Score',
    database: {
      status: dbHealth.connected ? 'connected' : 'disconnected',
      engine: dbHealth.database
    },
    liveLlmProvider: hasGroq ? 'Groq (llama-3.3-70b)' : (hasGemini ? 'Google Gemini' : 'Deterministic Grounded Synthesizer'),
    timestamp: new Date().toISOString()
  });
});

// 2. POST /api/ai/search - Hybrid Retrieval with Cosine & BM25 Scoring
router.post('/search', (req, res) => {
  const { query, limit = 5, filters = {} } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Valid query string is required.' });
  }

  const sanitizedLimit = Math.max(1, Math.min(20, parseInt(limit, 10) || 5));
  const { paperId, region, area } = filters;

  try {
    const qVec = generateEmbedding(query.trim());
    const chunks = searchChunks(db, query.trim(), { paperId, region, area, topK: sanitizedLimit });

    const results = chunks.map(c => {
      const cVec = generateEmbedding(c.text);
      const cosScore = Math.round(cosineSimilarity(qVec, cVec) * 10000) / 10000;
      const kwScore = Math.round(keywordScore(query.trim(), c.text) * 10000) / 10000;
      const hybridScore = Math.round(((cosScore * 0.65) + (kwScore * 0.35)) * 10000) / 10000;

      return {
        chunkId: c.chunkId,
        paperId: c.paperId,
        paperTitle: c.paperTitle,
        polarRegion: c.polarRegion,
        researchArea: c.researchArea,
        section: c.sectionName,
        page: c.pageNumber,
        snippet: c.text,
        cosineScore: cosScore,
        keywordScore: kwScore,
        hybridScore: hybridScore,
        confidence: c.confidencePercent / 100,
        provenance: {
          paperId: c.paperId,
          paperTitle: c.paperTitle,
          sectionName: c.sectionName,
          pageNumber: c.pageNumber,
          confidenceScore: c.confidencePercent
        }
      };
    });

    res.json({
      query: query.trim(),
      total: results.length,
      scoring: '0.65 * Cosine + 0.35 * Keyword',
      results
    });
  } catch (err) {
    console.error('AI Hybrid Search Error:', err);
    res.status(500).json({ error: 'Error executing AI hybrid retrieval' });
  }
});

// 3. POST /api/ai/ask - Section-Grounded Question Answering
router.post('/ask', async (req, res) => {
  const { query, paperId, region, area } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'A query string is required.' });
  }

  try {
    const result = await answerQueryAsync(db, query.trim(), { paperId, region, area, topK: 4 });

    // Log query in audit logs
    db.execute(
      `INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `ai-ask-${Date.now()}`,
        req.user ? req.user.name : 'Public User',
        req.user ? req.user.role : 'public',
        'AI_QUESTION_ANSWERED',
        paperId || null,
        null,
        query.trim().slice(0, 80),
        `Retrieved ${result.sources.length} sources with top confidence ${result.sources[0]?.confidenceScore || 0}%`
      ]
    );

    const topConfidence = result.sources[0]?.confidenceScore ? result.sources[0].confidenceScore / 100 : 0;

    res.json({
      answer: result.answer,
      sources: result.sources,
      confidence: topConfidence,
      retrieval: {
        sourcesCount: result.sources.length,
        isLlmSynthesized: Boolean(result.isLlmSynthesized),
        scoringFormula: '0.65 * Cosine + 0.35 * Keyword'
      }
    });
  } catch (err) {
    console.error('AI Ask Error:', err);
    res.status(500).json({ error: 'Error processing polar science AI question' });
  }
});

// 4. POST /api/ai/summarize - Fetch / Generate Summary for Paper
router.post('/summarize', (req, res) => {
  const { paperId } = req.body;

  if (!paperId || typeof paperId !== 'string') {
    return res.status(400).json({ error: 'Valid paperId is required.' });
  }

  const paper = db.queryGet('SELECT * FROM papers WHERE id = ?', [paperId]);
  if (!paper) {
    return res.status(404).json({ error: 'Paper not found.' });
  }

  // Check embargo
  if (paper.status === 'embargoed' && (!req.user || req.user.role === 'public')) {
    return res.status(403).json({ error: 'Paper is under scientific embargo.' });
  }

  const aiOutput = db.queryGet('SELECT * FROM ai_outputs WHERE paper_id = ?', [paperId]);
  if (aiOutput) {
    return res.json({
      paperId: paper.id,
      paperTitle: paper.title,
      englishSummary: aiOutput.english_summary,
      hindiSummary: aiOutput.hindi_summary,
      keyFindings: JSON.parse(aiOutput.key_findings || '[]'),
      importantTerms: JSON.parse(aiOutput.important_terms || '[]'),
      whyItMatters: aiOutput.why_it_matters,
      socialMediaDraft: aiOutput.social_media_draft,
      citationText: aiOutput.citation_text,
      generatedAt: aiOutput.generated_at
    });
  }

  // Fallback generation based on abstract
  res.json({
    paperId: paper.id,
    paperTitle: paper.title,
    englishSummary: `Scientific summary of "${paper.title}": ${paper.abstract}`,
    hindiSummary: `शोध सारांश: ${paper.abstract.slice(0, 150)}...`,
    keyFindings: [`Conducted multi-year polar observation at ${paper.institution}.`, `Focused on ${paper.research_area} dynamics in ${paper.polar_region}.`],
    importantTerms: [{ term: paper.research_area, definition: `Primary scientific domain investigating ${paper.polar_region} cryosphere.` }],
    whyItMatters: `Provides critical empirical evidence for global polar change and environmental stewardship.`,
    socialMediaDraft: `❄️ New polar research on ${paper.title} from #DHRUVA portal! #NCPOR #PolarScience`,
    citationText: `${paper.authors} (${paper.publication_year}). ${paper.title}. DHRUVA Repository.`,
    generatedAt: new Date().toISOString()
  });
});

// 5. POST /api/ai/claims - Get / Extract Claims for Paper
router.post('/claims', (req, res) => {
  const { paperId } = req.body;

  if (!paperId || typeof paperId !== 'string') {
    return res.status(400).json({ error: 'Valid paperId is required.' });
  }

  const claims = db.queryAll(`
    SELECT 
      c.id, c.paper_id, c.generated_claim, c.source_text, c.source_section,
      c.source_page, c.confidence_score, c.grounding_status, c.decision,
      v.reviewer_comment, v.verified_at
    FROM claims c
    LEFT JOIN verifications v ON c.id = v.claim_id
    WHERE c.paper_id = ?
  `, [paperId]);

  res.json({
    paperId,
    totalClaims: claims.length,
    claims: claims.map(c => ({
      id: c.id,
      paperId: c.paper_id,
      generatedClaim: c.generated_claim,
      sourceText: c.source_text,
      sourceSection: c.source_section,
      sourcePage: c.source_page,
      confidenceScore: c.confidence_score,
      groundingStatus: c.grounding_status,
      decision: c.decision,
      reviewerComment: c.reviewer_comment,
      verifiedAt: c.verified_at
    }))
  });
});

// 6. POST /api/ai/claims/:id/verify - Admin Verification of AI Claim
router.post('/claims/:id/verify', requireRole(['admin']), (req, res) => {
  const claimId = req.params.id;
  const { paperId, decision, reviewerComment, editedText } = req.body;

  if (!claimId || !decision || !['Approved', 'Edited', 'Rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Valid claim ID and decision (Approved, Edited, Rejected) are required.' });
  }

  const claim = db.queryGet('SELECT * FROM claims WHERE id = ?', [claimId]);
  if (!claim) {
    return res.status(404).json({ error: 'Claim not found.' });
  }

  const resolvedPaperId = paperId || claim.paper_id;
  const groundingStatus = decision === 'Approved' ? 'Verified' : (decision === 'Rejected' ? 'Unsupported' : 'Partially Verified');

  // Update claim
  db.execute(`
    UPDATE claims 
    SET decision = ?,
        grounding_status = ?,
        generated_claim = COALESCE(?, generated_claim)
    WHERE id = ?
  `, [decision, groundingStatus, editedText || null, claimId]);

  // Record verification entry
  const verId = `ver-${claimId}-${Date.now().toString(36)}`;
  db.execute(`
    INSERT INTO verifications (id, claim_id, paper_id, reviewer_id, reviewer_comment, decision)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [verId, claimId, resolvedPaperId, req.user.userId, reviewerComment || 'Verified by Admin Reviewer', decision]);

  // Log in audit log
  db.execute(`
    INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
    VALUES (?, ?, 'admin', 'CLAIM_VERIFIED', ?, ?, ?, ?)
  `, [
    `audit-${Date.now()}`,
    req.user.name,
    resolvedPaperId,
    claim.grounding_status,
    groundingStatus,
    `Claim ${claimId} verified as ${decision}. Comment: ${reviewerComment || 'None'}`
  ]);

  res.json({
    message: `Claim ${decision.toLowerCase()} successfully.`,
    claimId,
    decision,
    groundingStatus
  });
});

// 7. POST /api/ai/mcqs/generate - Fetch / Generate Grounded MCQs
router.post('/mcqs/generate', (req, res) => {
  const { paperId } = req.body;

  if (!paperId || typeof paperId !== 'string') {
    return res.status(400).json({ error: 'Valid paperId is required.' });
  }

  const mcqs = db.queryAll('SELECT * FROM mcqs WHERE paper_id = ?', [paperId]);
  res.json({
    paperId,
    totalMCQs: mcqs.length,
    mcqs: mcqs.map(m => ({
      id: m.id,
      paperId: m.paper_id,
      question: m.question,
      options: {
        A: m.option_a,
        B: m.option_b,
        C: m.option_c,
        D: m.option_d
      },
      correctOption: m.correct_option,
      explanation: m.explanation,
      sourceSection: m.source_section,
      sourcePage: m.source_page
    }))
  });
});

// 8. POST /api/ai/flashcards/generate - Fetch / Generate Grounded Flashcards
router.post('/flashcards/generate', (req, res) => {
  const { paperId } = req.body;

  if (!paperId || typeof paperId !== 'string') {
    return res.status(400).json({ error: 'Valid paperId is required.' });
  }

  const flashcards = db.queryAll('SELECT * FROM flashcards WHERE paper_id = ?', [paperId]);
  res.json({
    paperId,
    totalFlashcards: flashcards.length,
    flashcards: flashcards.map(f => ({
      id: f.id,
      paperId: f.paper_id,
      front: f.front,
      back: f.back,
      sourceSection: f.source_section
    }))
  });
});

module.exports = router;
