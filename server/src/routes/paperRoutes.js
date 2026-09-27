const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const db = require('../db/db.js');


// GET /api/papers - Public Research Search with rich filtering
router.get('/', (req, res) => {
  const { search, region, area, year, locationId, sort = 'latest', author, institution, peerReviewed, openAccess } = req.query;

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

  // Author filter (Advanced)
  if (author && author.trim()) {
    sql += ` AND p.authors LIKE ?`;
    params.push(`%${author.trim()}%`);
  }

  // Institution filter (Advanced)
  if (institution && institution !== 'All' && institution.trim()) {
    sql += ` AND p.institution LIKE ?`;
    params.push(`%${institution.trim()}%`);
  }

  // Peer-reviewed (has DOI)
  if (peerReviewed === 'true' || peerReviewed === true) {
    sql += ` AND p.doi IS NOT NULL AND p.doi != ''`;
  }

  // Open Access
  if (openAccess === 'true' || openAccess === true) {
    sql += ` AND p.visibility = 'public' AND p.embargo_enabled = 0`;
  }

  // Sorting
  if (sort === 'views') {
    sql += ` ORDER BY p.view_count DESC`;
  } else if (sort === 'oldest') {
    sql += ` ORDER BY p.publication_year ASC, p.created_at ASC`;
  } else {
    sql += ` ORDER BY p.publication_year DESC, p.created_at DESC`;
  }

  const allPapers = db.queryAll(sql, params);
  const totalCount = allPapers.length;

  // Pagination support with full backwards compatibility
  if (req.query.page || req.query.limit) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 12));
    const offset = (page - 1) * limit;
    const paginatedPapers = allPapers.slice(offset, offset + limit);
    return res.json({
      count: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      papers: paginatedPapers
    });
  }

  res.json({ count: totalCount, papers: allPapers });
});

// GET /api/papers/search/fts - Fast Full-Text Search with Porter Stemming & BM25
router.get('/search/fts', (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Search query parameter (q) is required.' });
  }

  try {
    // Sanitize query for FTS5 syntax
    const terms = q.trim().replace(/[^\w\s]/g, '').trim().split(/\s+/).filter(w => w.length > 1);
    if (terms.length === 0) {
      return res.json({ engine: 'SQLite FTS5', count: 0, papers: [] });
    }
    const ftsQuery = terms.map(w => `${w}*`).join(' ');

    const rows = db.queryAll(`
      SELECT 
        p.id, p.title, p.abstract, p.authors, p.institution, p.research_area,
        p.polar_region, p.publication_year, p.doi, p.thumbnail_url, p.view_count,
        bm25(papers_fts) as relevance_score
      FROM papers_fts f
      JOIN papers p ON f.paper_id = p.id
      WHERE papers_fts MATCH ? 
        AND p.status = 'published'
        AND (p.embargo_enabled = 0 OR p.embargo_until <= datetime('now'))
      ORDER BY relevance_score ASC
      LIMIT 20
    `, [ftsQuery]);

    res.json({
      engine: 'SQLite FTS5 Porter Stemmer',
      query: q,
      count: rows.length,
      papers: rows
    });
  } catch (err) {
    console.warn('FTS query error, falling back to LIKE:', err.message);
    const fallback = db.queryAll(`
      SELECT id, title, abstract, authors, institution, research_area, polar_region, publication_year, doi, thumbnail_url, view_count
      FROM papers
      WHERE status = 'published' AND (title LIKE ? OR abstract LIKE ? OR keywords LIKE ?)
        AND (embargo_enabled = 0 OR embargo_until <= datetime('now'))
      LIMIT 20
    `, [`%${q}%`, `%${q}%`, `%${q}%`]);
    res.json({ engine: 'Fallback LIKE', query: q, count: fallback.length, papers: fallback });
  }
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

// GET /api/papers/:id/citation - Export citation in BibTeX, RIS, or formatted plain text
router.get('/:id/citation', (req, res) => {
  const paperId = req.params.id;
  const format = (req.query.format || 'bibtex').toLowerCase();

  const paper = db.queryGet('SELECT * FROM papers WHERE id = ?', [paperId]);
  if (!paper) {
    return res.status(404).json({ error: 'Paper not found' });
  }

  const firstAuthor = paper.authors.split(/[,;]/)[0].trim().replace(/\s+/g, '_');
  const citeKey = `${firstAuthor}${paper.publication_year}`;

  if (format === 'bibtex') {
    const bibtex = `@article{${citeKey},
  title = {${paper.title}},
  author = {${paper.authors}},
  year = {${paper.publication_year}},
  institution = {${paper.institution}},
  doi = {${paper.doi || 'N/A'}},
  url = {https://dhruva.gov.in/papers/${paper.id}},
  journal = {DHRUVA Polar Science Repository - NCPOR}
}`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${citeKey}.bib"`);
    return res.send(bibtex);
  } else if (format === 'ris') {
    const ris = `TY  - JOUR
TI  - ${paper.title}
AU  - ${paper.authors}
PY  - ${paper.publication_year}
PB  - National Centre for Polar and Ocean Research (NCPOR)
DO  - ${paper.doi || ''}
UR  - https://dhruva.gov.in/papers/${paper.id}
ER  - `;
    res.setHeader('Content-Type', 'application/x-research-info-systems; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${citeKey}.ris"`);
    return res.send(ris);
  }

  // Default APA string
  res.json({
    apa: `${paper.authors} (${paper.publication_year}). ${paper.title}. DHRUVA Research Repository. https://doi.org/${paper.doi || paper.id}`,
    bibtexUrl: `/api/papers/${paper.id}/citation?format=bibtex`,
    risUrl: `/api/papers/${paper.id}/citation?format=ris`,
    pressKitUrl: `/api/papers/${paper.id}/press-kit`
  });
});

// GET /api/papers/:id/press-kit - Download One-Click Media & Press Kit (.zip)
router.get('/:id/press-kit', (req, res) => {
  const paperId = req.params.id;

  const paper = db.queryGet(`
    SELECT p.*, l.name as location_name, l.station_type
    FROM papers p
    LEFT JOIN locations l ON p.location_id = l.id
    WHERE p.id = ?
  `, [paperId]);

  if (!paper) {
    return res.status(404).json({ error: 'Paper not found' });
  }

  const aiOutput = db.queryGet('SELECT * FROM ai_outputs WHERE paper_id = ?', [paperId]);
  const sections = db.queryAll('SELECT section_name, content FROM paper_sections WHERE paper_id = ? ORDER BY section_order ASC', [paperId]);

  const archive = archiver('zip', { zlib: { level: 9 } });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="DHRUVA_PressKit_${paper.id}.zip"`);

  archive.on('error', (err) => {
    console.error('Archive error:', err);
    res.status(500).end();
  });

  archive.pipe(res);

  // 1. English Summary & Factsheet
  const summaryEn = `=======================================================
DHRUVA POLAR SCIENCE PRESS RELEASE & FACTSHEET
National Centre for Polar and Ocean Research (NCPOR)
Ministry of Earth Sciences (MoES), Government of India
=======================================================

TITLE: ${paper.title}
RESEARCHERS / AUTHORS: ${paper.authors}
INSTITUTION: ${paper.institution}
POLAR SECTOR: ${paper.polar_region} (${paper.location_name || 'Polar Grid'})
PUBLICATION YEAR: ${paper.publication_year}
DOI / IDENTIFIER: ${paper.doi || paper.id}

--- SIMPLE ENGLISH SUMMARY (FOR MEDIA & EDUCATORS) ---
${aiOutput?.english_summary || paper.abstract}

--- WHY IT MATTERS TO CITIZENS ---
${aiOutput?.why_it_matters || 'Polar research serves as the planetary climate indicator, revealing environmental shifts that govern monsoons and sea level rise.'}

--- SOCIAL MEDIA COPY ---
${aiOutput?.social_media_draft || `❄️ New scientific findings from India's polar expedition: "${paper.title}". Discover more on the DHRUVA portal.`}
`;
  archive.append(summaryEn, { name: '01_English_Summary_and_Factsheet.txt' });

  // 2. Hindi Summary
  if (aiOutput?.hindi_summary) {
    const summaryHi = `=======================================================
ध्रुव (DHRUVA) ध्रुवीय विज्ञान प्रेस विज्ञप्ति
राष्ट्रीय ध्रुवीय एवं समुद्री अनुसंधान केंद्र (NCPOR)
पृथ्वी विज्ञान मंत्रालय, भारत सरकार
=======================================================

शीर्षक: ${paper.title}
वैज्ञानिक: ${paper.authors}
संस्थान: ${paper.institution}
क्षेत्र: ${paper.polar_region === 'Antarctic' ? 'अंटार्कटिक' : 'आर्कटिक'} (${paper.location_name || 'ध्रुवीय केंद्र'})

--- हिंदी सारांश ---
${aiOutput.hindi_summary}
`;
    archive.append(summaryHi, { name: '02_Hindi_Summary_हिंदी_सारांश.txt' });
  }

  // 3. Metadata JSON
  const metaObj = {
    dhruva_portal: 'https://dhruva.gov.in',
    paper_id: paper.id,
    title: paper.title,
    authors: paper.authors,
    institution: paper.institution,
    polar_region: paper.polar_region,
    station: paper.location_name,
    doi: paper.doi,
    sections_count: sections.length,
    download_timestamp: new Date().toISOString()
  };
  archive.append(JSON.stringify(metaObj, null, 2), { name: 'metadata.json' });

  // 4. Citation BibTeX
  const citeKey = `${paper.authors.split(/[,;]/)[0].trim().replace(/\s+/g, '_')}${paper.publication_year}`;
  const bibtex = `@article{${citeKey},
  title = {${paper.title}},
  author = {${paper.authors}},
  year = {${paper.publication_year}},
  institution = {${paper.institution}},
  doi = {${paper.doi || 'N/A'}},
  url = {https://dhruva.gov.in/papers/${paper.id}},
  journal = {DHRUVA Polar Science Repository - NCPOR}
}`;
  archive.append(bibtex, { name: 'citation.bib' });

  // 5. NCPOR Terms & Media Guidelines
  const terms = `DHRUVA MEDIA USAGE GUIDELINES
Under Ministry of Earth Sciences (MoES) Open Outreach Policy:
1. All textual summaries and factsheets may be freely syndicated in print, digital, or broadcast journalism with attribution to "NCPOR / DHRUVA Portal".
2. Direct quotes from the paper must cite the primary authors.
3. For television or video footage inquiries, contact: outreach@ncpor.res.in`;
  archive.append(terms, { name: 'MEDIA_TERMS_AND_ATTRIBUTION.txt' });

  archive.finalize();
});

module.exports = router;


