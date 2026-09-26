const express = require('express');
const router = express.Router();
const db = require('../db/db.js');
const { answerQuery, searchChunks } = require('../services/ragService.js');

// POST /api/rag/ask - Query the DHRUVA Grounded RAG Pipeline
router.post('/ask', (req, res) => {
  const { query, paperId, region, area } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'A query string is required.' });
  }

  try {
    const result = answerQuery(db, query.trim(), { paperId, region, area, topK: 4 });

    // Log query in audit logs for analytics
    db.execute(
      `INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `rag-log-${Date.now()}`,
        req.user ? req.user.name : 'Public Explorer',
        req.user ? req.user.role : 'public',
        'RAG_QUERY_ANSWERED',
        paperId || null,
        null,
        query.slice(0, 80),
        `Retrieved ${result.sources.length} grounded source citations with top confidence ${result.sources[0]?.confidenceScore || 0}%`
      ]
    );

    res.json(result);
  } catch (err) {
    console.error('RAG Query Error:', err);
    res.status(500).json({ error: 'Error processing polar science RAG query' });
  }
});

// POST /api/rag/semantic-search - Return top chunks directly
router.post('/semantic-search', (req, res) => {
  const { query, paperId, region, area, topK = 6 } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'A query string is required.' });
  }

  try {
    const chunks = searchChunks(db, query.trim(), { paperId, region, area, topK });
    res.json({ count: chunks.length, chunks });
  } catch (err) {
    console.error('Semantic Search Error:', err);
    res.status(500).json({ error: 'Error performing semantic retrieval' });
  }
});

module.exports = router;
