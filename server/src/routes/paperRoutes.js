const express = require('express');
const router = express.Router();
const db = require('../db/db.js');

// GET /api/papers - Public Research Search with rich filtering
router.get('/', (req, res) => {
  const { search, region, area, year, locationId, sort = 'latest' } = req.query;

  // Base query: Only published and non-embargoed papers appear in public portal
  let sql = `
    SELECT 
      p.id, p.title, p.abstract, p.authors, p.institution, p.research_area, 
      p.polar_region, p.location_id, p.keywords, p.publication_year, p.doi, 
      p.thumbnail_url, p.document_url, p.status, p.visibility, p.embargo_enabled, 
      p.embargo_until, p.view_count, p.download_count, p.is_demo, p.created_at,
      l.name as location_name, l.station_type
    FROM papers p
    LEFT JOIN locations l ON p.location_id = l.id
    WHERE p.status = 'published'
      AND (p.embargo_enabled = 0 OR p.embargo_until IS NULL OR p.embargo_until <= datetime('now'))
  `;
  const params = [];

  // Search keyword across title, abstract, authors, keywords, institution
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    sql += ` AND (p.title LIKE ? OR p.abstract LIKE ? OR p.authors LIKE ? OR p.keywords LIKE ? OR p.institution LIKE ?)`;
    params.push(term, term, term, term, term);
  }

  // Region filter
  if (region && region !== 'All') {
    sql += ` AND p.polar_region = ?`;
    params.push(region);
  }

  // Research Area filter
  if (area && area !== 'All') {
    sql += ` AND p.research_area = ?`;
    params.push(area);
  }

  // Year filter
  if (year && year !== 'All') {
    sql += ` AND p.publication_year = ?`;
    params.push(parseInt(year, 10));
  }

  // Location filter
  if (locationId && locationId !== 'All') {
    sql += ` AND p.location_id = ?`;
    params.push(locationId);
  }

  // Sorting
  if (sort === 'views') {
    sql += ` ORDER BY p.view_count DESC`;
  } else if (sort === 'oldest') {
    sql += ` ORDER BY p.publication_year ASC, p.created_at ASC`;
  } else {
    sql += ` ORDER BY p.publication_year DESC, p.created_at DESC`;
  }

  const papers = db.queryAll(sql, params);
  res.json({ count: papers.length, papers });
});

// GET /api/papers/featured
router.get('/featured', (req, res) => {
  const featured = db.queryAll(`
    SELECT 
      p.id, p.title, p.abstract, p.authors, p.institution, p.research_area, 
      p.polar_region, p.publication_year, p.doi, p.thumbnail_url, p.view_count, p.is_demo,
      l.name as location_name
    FROM papers p
    LEFT JOIN locations l ON p.location_id = l.id
    WHERE p.status = 'published' AND (p.embargo_enabled = 0 OR p.embargo_until <= datetime('now'))
    ORDER BY p.view_count DESC
    LIMIT 6
  `);
  res.json({ papers: featured });
});

// GET /api/papers/:id - Full Paper Detail for Reading & Interactive Learning
router.get('/:id', (req, res) => {
  const paperId = req.params.id;

  const paper = db.queryGet(`
    SELECT 
      p.*, l.name as location_name, l.latitude, l.longitude, l.station_type,
      r.name as uploader_name, r.institution as uploader_institution, r.avatar as uploader_avatar
    FROM papers p
    LEFT JOIN locations l ON p.location_id = l.id
    LEFT JOIN researchers r ON p.uploaded_by = r.id
    WHERE p.id = ?
  `, [paperId]);

  if (!paper) {
    return res.status(404).json({ error: 'Research paper not found' });
  }

  // Check embargo restrictions for non-published/embargoed papers
  const isEmbargoActive = paper.embargo_enabled && paper.embargo_until && new Date(paper.embargo_until) > new Date();
  if ((paper.status !== 'published' || isEmbargoActive) && !req.user) {
    if (paper.status === 'embargoed' || isEmbargoActive) {
      return res.status(403).json({
        error: 'This research paper is currently under active scientific embargo and is not accessible on the public portal.',
        embargoUntil: paper.embargo_until,
        status: 'embargoed'
      });
    }
  }

  // Fetch structured sections
  const sections = db.queryAll(
    'SELECT * FROM paper_sections WHERE paper_id = ? ORDER BY section_order ASC',
    [paperId]
  );

  // Fetch AI Outputs
  const aiOutput = db.queryGet(
    'SELECT * FROM ai_outputs WHERE paper_id = ?',
    [paperId]
  );

  // Parse JSON fields in aiOutput if present
  let parsedAiOutput = null;
  if (aiOutput) {
    parsedAiOutput = {
      ...aiOutput,
      key_findings: JSON.parse(aiOutput.key_findings || '[]'),
      important_terms: JSON.parse(aiOutput.important_terms || '[]')
    };
  }

  // Fetch MCQs
  const mcqs = db.queryAll(
    'SELECT * FROM mcqs WHERE paper_id = ?',
    [paperId]
  );

  // Fetch Flashcards
  const flashcards = db.queryAll(
    'SELECT * FROM flashcards WHERE paper_id = ?',
    [paperId]
  );

  // Fetch Grounding Claims
  const claims = db.queryAll(
    'SELECT * FROM claims WHERE paper_id = ?',
    [paperId]
  );

  // Increment view count asynchronously
  db.execute('UPDATE papers SET view_count = view_count + 1 WHERE id = ?', [paperId]);

  res.json({
    paper,
    sections,
    aiOutput: parsedAiOutput,
    mcqs,
    flashcards,
    claims
  });
});

module.exports = router;
