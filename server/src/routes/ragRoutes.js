const express = require('express');
const router = express.Router();
const db = require('../db/db.js');
const { answerQuery, answerQueryAsync, searchChunks } = require('../services/ragService.js');

// POST /api/rag/ask - Query the DHRUVA Grounded RAG Pipeline
router.post('/ask', async (req, res) => {
  const { query, paperId, region, area, history = [], mode } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'A query string is required.' });
  }

  try {
    const result = await answerQueryAsync(db, query.trim(), { 
      paperId, 
      region, 
      area, 
      topK: 5,
      history,
      mode 
    });

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
        `Retrieved ${result.sources.length} grounded source citations with mode ${result.mode || 'standard'}`
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
  const { query, paperId, region, area, mode } = req.query;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'A query string is required.' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const result = await answerQueryAsync(db, query.trim(), { 
      paperId, 
      region, 
      area, 
      topK: 5,
      mode 
    });


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
router.post('/semantic-search', async (req, res) => {
  const { query, paperId, region, area, topK = 6 } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'A query string is required.' });
  }

  try {
    const chunks = await searchChunks(db, query.trim(), { paperId, region, area, topK });
    res.json({ count: chunks.length, chunks });
  } catch (err) {
    console.error('Semantic Search Error:', err);
    res.status(500).json({ error: 'Error performing semantic retrieval' });
  }
});

// GET /api/rag/status - Check configured LLM providers (Groq / Gemini / Grounded Engine)
const { getLLMProviderStatus, generateChatCompletion } = require('../services/llmService.js');

router.get('/status', (req, res) => {
  const status = getLLMProviderStatus();
  res.json({
    status: 'ok',
    llmProviders: status,
    timestamp: new Date().toISOString()
  });
});

// POST /api/rag/test-llm - Test live connection with Groq or Gemini
router.post('/test-llm', async (req, res) => {
  const { prompt = 'Explain polar albedo feedback in two sentences.' } = req.body;
  try {
    const startTime = Date.now();
    const result = await generateChatCompletion(
      'You are DHRUVA Polar Science AI assistant.',
      prompt,
      { max_tokens: 150 }
    );
    const latencyMs = Date.now() - startTime;

    if (!result) {
      return res.json({
        success: false,
        message: 'No external LLM API key configured (GROQ_API_KEY or GEMINI_API_KEY). DHRUVA will use the built-in deterministic grounded engine.',
        status: getLLMProviderStatus()
      });
    }

    res.json({
      success: true,
      provider: result.provider,
      model: result.model,
      response: result.content,
      latencyMs
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
