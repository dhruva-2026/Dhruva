const express = require('express');
const router = express.Router();

const API_SPEC = {
  title: 'DHRUVA Polar Science Intelligence & Dissemination API',
  version: '2.4.0',
  description: 'Official API documentation for NCPOR / MoES Polar Science Knowledge Repository, Grounded RAG, and AI Artifact Services.',
  baseUrl: '/api',
  endpoints: [
    {
      group: 'Authentication & Access Control',
      routes: [
        { method: 'POST', path: '/auth/login', desc: 'Authenticate user and return JWT bearer token with role claims (student, researcher, admin)' },
        { method: 'POST', path: '/auth/register', desc: 'Register a new researcher or student account with institutional affiliation' },
        { method: 'GET', path: '/auth/me', desc: 'Verify and return active user profile from JWT session' },
        { method: 'GET', path: '/auth/demo-accounts', desc: 'List instant 1-click test credentials for SIH judging and demonstration' }
      ]
    },
    {
      group: 'Polar Grounded RAG & LLM Services',
      routes: [
        { method: 'POST', path: '/rag/ask', desc: 'Query polar scientific knowledge base with hybrid RRF retrieval, section weighting, and exact provenance citations' },
        { method: 'GET', path: '/rag/stream', desc: 'Server-Sent Events (SSE) streaming endpoint for live token generation' },
        { method: 'POST', path: '/rag/semantic-search', desc: 'Direct dense vector + BM25 chunk retrieval returning top-K scored chunks' },
        { method: 'GET', path: '/rag/status', desc: 'Diagnostic health check of Groq Cloud, Gemini API, and Grounded Deterministic Engine' }
      ]
    },
    {
      group: 'Scientific Research & Paper Repository',
      routes: [
        { method: 'GET', path: '/papers', desc: 'List peer-reviewed polar papers with filters (region, area, year, location, search)' },
        { method: 'GET', path: '/papers/:id', desc: 'Fetch single paper with parsed sections, AI summaries, MCQs, flashcards, and verified claims' },
        { method: 'GET', path: '/papers/featured', desc: 'Fetch high-impact featured research publications for hero showcase' }
      ]
    },
    {
      group: 'Researcher Ingestion Pipeline',
      routes: [
        { method: 'POST', path: '/researcher/upload', desc: 'Upload scientific PDF with automatic 8-section extraction, embedding generation, bilingual summaries, MCQs, and claims' },
        { method: 'GET', path: '/researcher/dashboard', desc: 'Researcher overview metrics (submissions, reviews, approved, embargoed)' },
        { method: 'GET', path: '/researcher/papers', desc: 'List researcher personal submissions with revision status' }
      ]
    },
    {
      group: 'Admin Verification & Scientific Integrity',
      routes: [
        { method: 'GET', path: '/admin/queue', desc: 'Verification queue of submitted papers awaiting editorial approval' },
        { method: 'GET', path: '/admin/verification/:paperId', desc: 'Split-screen verification payload with original text vs AI claims' },
        { method: 'POST', path: '/admin/claims/verify', desc: 'Approve, edit, or reject specific factual claim with reviewer comments' },
        { method: 'POST', path: '/admin/claims/batch-verify', desc: 'Batch verify all claims for a paper in one click' },
        { method: 'POST', path: '/admin/papers/decision', desc: 'Approve or reject paper with publication or scheduled embargo assignment' },
        { method: 'POST', path: '/admin/papers/batch-decision', desc: 'Batch approve or reject multiple papers' },
        { method: 'GET', path: '/admin/audit-logs', desc: 'Tamper-evident activity logs recording all administrative decisions' },
        { method: 'GET', path: '/admin/analytics', desc: 'Platform usage statistics, regional breakdown, and query analytics' }
      ]
    },
    {
      group: 'Conversational Memory & Chat Threads',
      routes: [
        { method: 'GET', path: '/chat/sessions', desc: 'List active chat conversation threads' },
        { method: 'POST', path: '/chat/sessions', desc: 'Create a new discussion session' },
        { method: 'GET', path: '/chat/sessions/:id', desc: 'Get full message history for a session' },
        { method: 'POST', path: '/chat/sessions/:id/messages', desc: 'Append message to session and optionally generate grounded AI reply' }
      ]
    }
  ]
};

// GET /api/docs/json - Return raw OpenAPI-style JSON specification
router.get('/json', (req, res) => {
  res.json(API_SPEC);
});

// GET /api/docs - Return interactive HTML documentation viewer
router.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DHRUVA API Documentation | MoES & NCPOR</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0B1120;
      --card-bg: #1E293B;
      --border: #334155;
      --primary: #0284C7;
      --primary-light: #38BDF8;
      --text: #F1F5F9;
      --text-muted: #94A3B8;
      --method-get: #10B981;
      --method-post: #3B82F6;
      --method-put: #F59E0B;
      --method-delete: #EF4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 30px 20px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .header {
      background: linear-gradient(135deg, #0369A1 0%, #0F172A 100%);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 24px;
      border-radius: 16px;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    .badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.2);
      color: var(--primary-light);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    h1 { font-size: 26px; font-weight: 800; margin-bottom: 6px; letter-spacing: -0.02em; }
    .desc { color: #E2E8F0; font-size: 13.5px; }
    .group-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 24px;
      overflow: hidden;
    }
    .group-header {
      padding: 14px 20px;
      background: rgba(15, 23, 42, 0.6);
      border-bottom: 1px solid var(--border);
      font-weight: 700;
      font-size: 15px;
      color: var(--primary-light);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .route-row {
      padding: 12px 20px;
      border-bottom: 1px solid rgba(51, 65, 85, 0.5);
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 13px;
      transition: background 0.15s;
    }
    .route-row:last-child { border-bottom: none; }
    .route-row:hover { background: rgba(56, 189, 248, 0.04); }
    .method-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
      min-width: 60px;
      text-align: center;
    }
    .method-get { background: rgba(16, 185, 129, 0.15); color: var(--method-get); border: 1px solid rgba(16, 185, 129, 0.3); }
    .method-post { background: rgba(59, 130, 246, 0.15); color: var(--method-post); border: 1px solid rgba(59, 130, 246, 0.3); }
    .method-put { background: rgba(245, 158, 11, 0.15); color: var(--method-put); border: 1px solid rgba(245, 158, 11, 0.3); }
    .method-delete { background: rgba(239, 68, 68, 0.15); color: var(--method-delete); border: 1px solid rgba(239, 68, 68, 0.3); }
    .path-code {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      color: #FFFFFF;
      min-width: 250px;
    }
    .route-desc { color: var(--text-muted); flex: 1; font-size: 12.5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">NCPOR &amp; MoES Verified API Specification</span>
      <h1>❄️ DHRUVA REST &amp; AI API Documentation</h1>
      <p class="desc">${API_SPEC.description}</p>
    </div>

    ${API_SPEC.endpoints.map(group => `
      <div class="group-card">
        <div class="group-header">📁 ${group.group}</div>
        ${group.routes.map(r => `
          <div class="route-row">
            <span class="method-badge method-${r.method.toLowerCase()}">${r.method}</span>
            <span class="path-code">${API_SPEC.baseUrl}${r.path}</span>
            <span class="route-desc">${r.desc}</span>
          </div>
        `).join('')}
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = router;
