const express = require('express');
const router = express.Router();
const db = require('../db/db.js');
const { requireRole } = require('../middleware/auth.js');
const { generateEmbedding } = require('../services/ragService.js');

// All researcher endpoints require researcher or admin role
router.use(requireRole(['researcher', 'admin']));

// GET /api/researcher/dashboard - Researcher overview metrics
router.get('/dashboard', (req, res) => {
  const researcherId = req.user.researcherId || 'res-1';

  // Count papers by status for this researcher
  const counts = db.queryAll(`
    SELECT status, COUNT(*) as count 
    FROM papers 
    WHERE uploaded_by = ? 
    GROUP BY status
  `, [researcherId]);

  const metrics = {
    totalPapers: 0,
    underReview: 0,
    published: 0,
    rejected: 0,
    drafts: 0,
    embargoed: 0
  };

  counts.forEach(c => {
    metrics.totalPapers += c.count;
    if (c.status === 'under_review') metrics.underReview += c.count;
    if (c.status === 'published') metrics.published += c.count;
    if (c.status === 'rejected') metrics.rejected += c.count;
    if (c.status === 'draft') metrics.drafts += c.count;
    if (c.status === 'embargoed') metrics.embargoed += c.count;
  });

  // Recent 5 papers
  const recentPapers = db.queryAll(`
    SELECT id, title, research_area, polar_region, status, created_at, updated_at
    FROM papers 
    WHERE uploaded_by = ?
    ORDER BY created_at DESC
    LIMIT 5
  `, [researcherId]);

  res.json({ metrics, recentPapers });
});

// GET /api/researcher/papers - Researcher repository with status filter
router.get('/papers', (req, res) => {
  const researcherId = req.user.researcherId || 'res-1';
  const { status } = req.query;

  let sql = `
    SELECT 
      p.*, l.name as location_name
    FROM papers p
    LEFT JOIN locations l ON p.location_id = l.id
    WHERE p.uploaded_by = ?
  `;
  const params = [researcherId];

  if (status && status !== 'all') {
    sql += ` AND p.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY p.created_at DESC`;

  const papers = db.queryAll(sql, params);
  res.json({ papers });
});

// POST /api/researcher/upload - 8-Step Upload & Live AI Extraction Pipeline
router.post('/upload', (req, res) => {
  const researcherId = req.user.researcherId || 'res-1';
  const {
    title,
    abstract,
    authors,
    institution,
    research_area,
    polar_region,
    location_id,
    keywords,
    publication_year,
    doi,
    embargo_enabled = 0,
    embargo_until = null,
    embargo_reason = '',
    custom_sections = null
  } = req.body;

  if (!title || !abstract) {
    return res.status(400).json({ error: 'Title and abstract are required.' });
  }

  const paperId = `paper-${Date.now().toString(36)}`;
  const pubYear = publication_year || new Date().getFullYear();
  const authorList = authors || req.user.name;
  const inst = institution || req.user.institution || 'National Centre for Polar and Ocean Research';
  const area = research_area || 'Glaciology';
  const region = polar_region || 'Antarctic';
  const paperDoi = doi || `10.1016/j.polar.${new Date().getFullYear()}.${Math.floor(1000 + Math.random() * 9000)}`;

  // Status defaults to 'under_review'
  const initialStatus = 'under_review';
  const visibility = 'private';

  try {
    // 1. Insert Paper Record
    db.execute(`
      INSERT INTO papers (
        id, title, abstract, authors, institution, research_area, polar_region, 
        location_id, keywords, publication_year, doi, document_url, thumbnail_url, 
        status, visibility, embargo_enabled, embargo_until, uploaded_by, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      paperId, title, abstract, authorList, inst, area, region,
      location_id || 'loc-1', keywords || 'polar science, antarctic, arctic',
      pubYear, paperDoi, '/uploads/sample_uploaded_paper.pdf',
      'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop',
      initialStatus, visibility, embargo_enabled ? 1 : 0, embargo_until, researcherId || 'res-1'
    ]);

    // 2. Insert Embargo Record if specified
    if (embargo_enabled && embargo_until) {
      db.execute(`
        INSERT INTO embargoes (id, paper_id, embargo_enabled, embargo_until, reason, status)
        VALUES (?, ?, 1, ?, ?, 'Active')
      `, [`emb-${paperId}`, paperId, embargo_until, embargo_reason || 'Researcher requested embargo']);
    }

    // 3. Process Paper Sections (simulate full structure)
    const sections = custom_sections || [
      { name: 'Abstract', order: 1, page_start: 1, page_end: 1, content: abstract },
      { name: 'Introduction', order: 2, page_start: 2, page_end: 3, content: `Recent observations in the ${region} polar biome indicate rapid responses of the cryosphere and ocean to radiative forcing. This paper presents empirical field data collected during scientific expeditions.` },
      { name: 'Methodology', order: 3, page_start: 4, page_end: 5, content: 'Data was gathered through continuous sensor logging, multi-spectral satellite telemetry, and in-situ CTD and aerosol sampling grids.' },
      { name: 'Study Area', order: 4, page_start: 6, page_end: 6, content: `Field experiments were centered at the designated polar coordinates in the ${region} sector under environmental guidelines of the Antarctic/Arctic scientific program.` },
      { name: 'Results', order: 5, page_start: 7, page_end: 8, content: `Quantitative analysis demonstrates a statistically significant trend (p < 0.01) with anomalous departures from the 30-year polar climatology. The primary signal reflects enhanced warm-phase teleconnections.` },
      { name: 'Discussion', order: 6, page_start: 9, page_end: 10, content: 'These results are consistent with coupled ocean-atmosphere models and highlight the disproportionate sensitivity of high-latitude regions.' },
      { name: 'Conclusion', order: 7, page_start: 11, page_end: 11, content: 'Continued year-round observational infrastructure is imperative to constrain uncertainty in polar projection scenarios.' },
      { name: 'References', order: 8, page_start: 12, page_end: 12, content: 'Indian Polar Research Series, Vol. 42 (2025).' }
    ];

    sections.forEach((s, idx) => {
      const secId = `sec-${paperId}-${idx + 1}`;
      db.execute(`
        INSERT INTO paper_sections (id, paper_id, section_name, section_order, content, page_start, page_end)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [secId, paperId, s.name, s.order, s.content, s.page_start, s.page_end]);

      // Generate RAG chunk & embedding
      const embedding = generateEmbedding(s.content);
      db.execute(`
        INSERT INTO paper_chunks (id, paper_id, section_id, section_name, chunk_index, text, page_number, embedding_json)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?)
      `, [`chk-${paperId}-${idx + 1}`, paperId, secId, s.name, s.content, s.page_start, JSON.stringify(embedding)]);
    });

    // 4. Generate AI Outputs (English, Hindi, Key Findings, Terms, Social Draft)
    const engSummary = `This research analyzes empirical polar findings from the ${region} region. Scientists observed statistically significant changes in cryospheric dynamics correlated with atmospheric circulation patterns, establishing a vital baseline for polar climate monitoring.`;
    const hindiSummary = `यह शोध ${region === 'Antarctic' ? 'अंटार्कटिक' : 'आर्कटिक'} क्षेत्र के वैज्ञानिक अवलोकनों का विश्लेषण करता है। वैज्ञानिकों ने वायुमंडलीय परिसंचरण पैटर्न से जुड़े महत्वपूर्ण परिवर्तनों को दर्ज किया, जो ध्रुवीय जलवायु निगरानी के लिए एक महत्वपूर्ण आधार रेखा स्थापित करता है।`;
    
    const keyFindings = JSON.stringify([
      `Statistically significant environmental departures (p < 0.01) documented in the ${region} polar sector.`,
      `Enhanced sensitivity of local cryospheric interfaces to warm-phase teleconnections.`,
      `Baseline measurements constrain high-latitude parameters for climate projections.`
    ]);

    const importantTerms = JSON.stringify([
      { term: `${region} Polar Teleconnection`, definition: 'Atmospheric wave trains connecting mid-latitude weather systems to polar ice dynamics.' },
      { term: 'Radiative Forcing', definition: 'The change in net irradiance at the tropopause causing heating or cooling of the planet.' }
    ]);

    db.execute(`
      INSERT INTO ai_outputs (
        id, paper_id, english_summary, hindi_summary, key_findings, 
        important_terms, why_it_matters, social_media_draft, citation_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      `ai-${paperId}`, paperId, engSummary, hindiSummary, keyFindings, importantTerms,
      'Polar research serves as the planetary early warning system, illuminating rapid climate transformations that dictate global sea levels.',
      `❄️ New Polar Submission: "${title}" by ${authorList} is now under verification on the DHRUVA portal. #PolarScience #DHRUVA`,
      `${authorList} (${pubYear}). ${title}. DHRUVA Research Repository.`
    ]);

    // 5. Generate Educational MCQs
    db.execute(`
      INSERT INTO mcqs (id, paper_id, question, option_a, option_b, option_c, option_d, correct_option, explanation, source_section, source_page)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'B', ?, 'Results', 7)
    `, [
      `mcq-${paperId}-1`, paperId,
      `What did quantitative analysis reveal regarding the polar observations in "${title}"?`,
      'No measurable change',
      'Statistically significant anomalous departure from 30-year climatology (p < 0.01)',
      'Total ice thickening across the entire sector',
      'Atmospheric cooling of 10°C',
      'Results on Page 7 document a statistically significant departure from the 30-year climatology.'
    ]);

    // 6. Generate Flashcard
    db.execute(`
      INSERT INTO flashcards (id, paper_id, front, back, source_section)
      VALUES (?, ?, ?, ?, 'Results')
    `, [
      `fc-${paperId}-1`, paperId,
      `What is the primary conclusion of "${title}"?`,
      `Documented significant cryospheric departures linked to warm-phase atmospheric teleconnections in the ${region} sector.`
    ]);

    // 7. Generate AI Claims for Grounding Verification
    db.execute(`
      INSERT INTO claims (id, paper_id, generated_claim, source_text, source_section, source_page, confidence_score, grounding_status, decision)
      VALUES (?, ?, ?, ?, 'Results', 7, 0.95, 'Needs Review', 'Pending')
    `, [
      `claim-${paperId}-1`, paperId,
      `Quantitative analysis demonstrated statistically significant departures from the 30-year polar climatology.`,
      `Quantitative analysis demonstrates a statistically significant trend (p < 0.01) with anomalous departures from the 30-year polar climatology.`
    ]);

    // 8. Add Audit Trail Events
    db.execute(`
      INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
      VALUES (?, ?, 'researcher', 'PAPER_SUBMITTED', ?, 'none', 'under_review', ?)
    `, [`audit-${Date.now()}-1`, req.user.name, paperId, `Uploaded paper: "${title}"`]);

    db.execute(`
      INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
      VALUES (?, 'System Pipeline', 'system', 'AI_PROCESSING_COMPLETED', ?, 'submitted', 'under_review', 'Extracted 8 sections, generated vector embeddings, bilingual summary, MCQs, and 1 grounding claim')
    `, [`audit-${Date.now()}-2`, paperId]);

    res.status(201).json({
      message: 'Paper successfully uploaded, processed by AI pipeline, and queued for Admin Verification.',
      paperId,
      status: initialStatus
    });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to process paper submission: ' + err.message });
  }
});

// POST /api/researcher/resubmit/:id - Resubmit a rejected paper
router.post('/resubmit/:id', (req, res) => {
  const paperId = req.params.id;
  const researcherId = req.user.researcherId || 'res-1';
  const { title, abstract, revision_notes } = req.body;

  const existing = db.queryGet('SELECT * FROM papers WHERE id = ? AND uploaded_by = ?', [paperId, researcherId]);
  if (!existing) {
    return res.status(404).json({ error: 'Paper not found or unauthorized' });
  }

  // Update paper metadata and set status back to under_review
  db.execute(`
    UPDATE papers 
    SET title = COALESCE(?, title),
        abstract = COALESCE(?, abstract),
        status = 'under_review',
        rejection_reason = NULL,
        admin_comment = NULL,
        updated_at = datetime('now')
    WHERE id = ?
  `, [title || null, abstract || null, paperId]);

  // Reset claims to Pending
  db.execute(`UPDATE claims SET decision = 'Pending', grounding_status = 'Needs Review' WHERE paper_id = ?`, [paperId]);

  // Log audit event
  db.execute(`
    INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
    VALUES (?, ?, 'researcher', 'PAPER_RESUBMITTED', ?, 'rejected', 'under_review', ?)
  `, [`audit-${Date.now()}`, req.user.name, paperId, `Resubmitted with revision notes: ${revision_notes || 'Revised manuscript with noise filtering.'}`]);

  res.json({ message: 'Paper successfully resubmitted for admin verification.', paperId });
});

module.exports = router;
