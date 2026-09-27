const express = require('express');
const router = express.Router();
const db = require('../db/db.js');
const { answerQuery, answerQueryAsync, searchChunks } = require('../services/ragService.js');

// POST /api/rag/ask - Query the DHRUVA Grounded RAG Pipeline
router.post('/ask', async (req, res) => {
  const { query, paperId, region, area } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'A query string is required.' });
  }

  try {
    const result = await answerQueryAsync(db, query.trim(), { paperId, region, area, topK: 4 });


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

// GET /api/rag/stream - Server-Sent Events (SSE) Streaming RAG Answer
router.get('/stream', async (req, res) => {
  const { query, paperId, region, area } = req.query;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'A query string is required.' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const result = await answerQueryAsync(db, query.trim(), { paperId, region, area, topK: 4 });

    // 1. Send sources metadata event first
    res.write(`event: sources\ndata: ${JSON.stringify(result.sources)}\n\n`);

    // 2. Stream tokens smoothly
    const fullText = result.answer || '';
    const words = fullText.split(/(\s+)/); // Preserves whitespace

    for (let i = 0; i < words.length; i++) {
      res.write(`event: token\ndata: ${JSON.stringify({ token: words[i] })}\n\n`);
      // Micro-delay for smooth token delivery
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    // 3. Send completion event
    res.write(`event: done\ndata: ${JSON.stringify({ completed: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('SSE Stream Error:', err);
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
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
