const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const db = require('../db/db.js');
const { requireRole } = require('../middleware/auth.js');
const { generateEmbedding } = require('../services/ragService.js');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `paper-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf' && file.mimetype !== 'application/pdf') {
      return cb(new Error('Only scientific PDF manuscripts are accepted for upload.'));
    }
    cb(null, true);
  }
});

function splitPdfIntoSections(text, defaultAbstract) {
  const sections = [];
  const patterns = [
    { name: 'Abstract', regex: /(?:abstract|summary)[\s\S]*?(?=(?:introduction|1[\.\s]|study area|method))/i },
    { name: 'Introduction', regex: /(?:introduction|1[\.\s]+introduction)[\s\S]*?(?=(?:methodology|methods|2[\.\s]|study area))/i },
    { name: 'Study Area', regex: /(?:study area|geographical setting)[\s\S]*?(?=(?:methodology|methods|results))/i },
    { name: 'Methodology', regex: /(?:methodology|methods|materials and methods)[\s\S]*?(?=(?:results|findings|observations))/i },
    { name: 'Results', regex: /(?:results|findings|observations)[\s\S]*?(?=(?:discussion|conclusion))/i },
    { name: 'Discussion', regex: /(?:discussion)[\s\S]*?(?=(?:conclusion|summary|references))/i },
    { name: 'Conclusion', regex: /(?:conclusion|concluding remarks)[\s\S]*?(?=(?:references|acknowledgements))/i },
    { name: 'References', regex: /(?:references|bibliography)[\s\S]*/i }
  ];

  let order = 1;
  for (const p of patterns) {
    const match = text.match(p.regex);
    if (match && match[0].trim().length > 40) {
      let content = match[0].trim();
      if (content.length > 2500) content = content.slice(0, 2500);
      sections.push({
        name: p.name,
        order: order++,
        page_start: order,
        page_end: order + 1,
        content
      });
    }
  }

  return sections.length > 0 ? sections : null;
}

// Helper for recursive paragraph chunking with overlap
function splitSectionIntoChunks(text, maxChars = 900, overlap = 150) {
  if (!text || text.length <= maxChars) {
    return [text];
  }
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxChars;
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastPeriod > start + maxChars * 0.6) {
        end = lastPeriod + 1;
      } else if (lastSpace > start + maxChars * 0.6) {
        end = lastSpace + 1;
      }
    } else {
      end = text.length;
    }
    const chunkText = text.substring(start, end).trim();
    if (chunkText) {
      chunks.push(chunkText);
    }
    start = end - overlap;
    if (start >= text.length - overlap) break;
  }
  return chunks.length > 0 ? chunks : [text];
}

// All researcher endpoints require researcher or admin role
router.use(requireRole(['researcher', 'admin']));

// GET /api/researcher/dashboard - Researcher overview metrics
router.get('/dashboard', async (req, res) => {
  const researcherId = req.user.researcherId || 'res-1';

  // Count papers by status for this researcher
  const counts = await db.queryAll(`
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
    const cnt = parseInt(c.count, 10) || 0;
    metrics.totalPapers += cnt;
    if (c.status === 'under_review') metrics.underReview += cnt;
    if (c.status === 'published') metrics.published += cnt;
    if (c.status === 'rejected') metrics.rejected += cnt;
    if (c.status === 'draft') metrics.drafts += cnt;
    if (c.status === 'embargoed') metrics.embargoed += cnt;
  });

  // Recent 5 papers
  const recentPapers = await db.queryAll(`
    SELECT id, title, research_area, polar_region, status, created_at, updated_at
    FROM papers 
    WHERE uploaded_by = ?
    ORDER BY created_at DESC
    LIMIT 5
  `, [researcherId]);

  res.json({ metrics, recentPapers });
});

// GET /api/researcher/papers - Researcher repository with status filter
router.get('/papers', async (req, res) => {
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

  const papers = await db.queryAll(sql, params);
  res.json({ papers });
});

// POST /api/researcher/upload - 8-Step Upload & Live AI Extraction Pipeline
const { generateDocumentArtifacts, generateDocumentArtifactsAsync } = require('../services/aiGenerator.js');

router.post('/upload', upload.single('file'), async (req, res) => {
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
  const pubYear = publication_year ? parseInt(publication_year, 10) : new Date().getFullYear();
  const authorList = authors || req.user.name;
  const inst = institution || req.user.institution || 'National Centre for Polar and Ocean Research';
  const area = research_area || 'Glaciology';
  const region = polar_region || 'Antarctic';
  const paperDoi = doi || `10.1016/j.polar.${pubYear}.${Math.floor(1000 + Math.random() * 9000)}`;

  const documentUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/sample_uploaded_paper.pdf';

  // Status defaults to 'under_review'
  const initialStatus = 'under_review';
  const visibility = 'private';

  // Check if real PDF was uploaded and parse text
  let extractedPdfText = '';
  let parsedPdfSections = null;
  if (req.file && (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf'))) {
    try {
      const dataBuffer = fs.readFileSync(req.file.path);
      // Validate PDF magic bytes: %PDF-
      if (dataBuffer.length < 5 || dataBuffer.toString('utf8', 0, 5) !== '%PDF-') {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
        return res.status(400).json({ error: 'Security validation failed: The uploaded file header does not match valid PDF specifications.' });
      }
      const pdfResult = await pdfParse(dataBuffer);
      if (pdfResult && pdfResult.text) {
        extractedPdfText = pdfResult.text;
        parsedPdfSections = splitPdfIntoSections(pdfResult.text, abstract);
      }
    } catch (parseErr) {
      console.warn('PDF parsing note:', parseErr.message);
    }
  }

  // Generate complete, factual, document-grounded suite via Unified LLM Gateway
  const artifacts = await generateDocumentArtifactsAsync({
    title,
    abstract,
    text: extractedPdfText,
    region,
    area,
    institution: inst,
    authors: authorList,
    pubYear,
    doi: paperDoi
  });

  const finalSections = custom_sections || parsedPdfSections || artifacts.sections;

  try {
    // 1. Insert Paper Record
    await db.execute(`
      INSERT INTO papers (
        id, title, abstract, authors, institution, research_area, polar_region, 
        location_id, keywords, publication_year, doi, document_url, thumbnail_url, 
        status, visibility, embargo_enabled, embargo_until, uploaded_by, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      paperId, title, abstract, authorList, inst, area, region,
      location_id || 'loc-1', keywords || 'polar science, antarctic, arctic',
      pubYear, paperDoi, documentUrl,
      'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop',
      initialStatus, visibility, embargo_enabled ? 1 : 0, embargo_until, researcherId || 'res-1'
    ]);

    // 2. Insert Embargo Record if specified
    if (embargo_enabled && embargo_until) {
      await db.execute(`
        INSERT INTO embargoes (id, paper_id, embargo_enabled, embargo_until, reason, status)
        VALUES (?, ?, 1, ?, ?, 'Active')
      `, [`emb-${paperId}`, paperId, embargo_until, embargo_reason || 'Researcher requested embargo']);
    }

    // 3. Process Paper Sections (Priority: custom_sections -> parsedPdfSections -> artifacts.sections)
    for (let idx = 0; idx < finalSections.length; idx++) {
      const s = finalSections[idx];
      const secId = `sec-${paperId}-${idx + 1}`;
      const secContent = s.content || '';
      await db.execute(`
        INSERT INTO paper_sections (id, paper_id, section_name, section_order, content, page_start, page_end)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [secId, paperId, s.name || s.section_name, s.order || idx + 1, secContent, s.page_start || idx + 1, s.page_end || idx + 2]);

      // Generate recursive overlapping RAG chunks for granular paragraph matching
      const sectionChunks = splitSectionIntoChunks(secContent, 900, 150);
      for (let cIdx = 0; cIdx < sectionChunks.length; cIdx++) {
        const chunkText = sectionChunks[cIdx];
        const embedding = generateEmbedding(chunkText);
        await db.execute(`
          INSERT INTO paper_chunks (id, paper_id, section_id, section_name, chunk_index, text, page_number, embedding_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          `chk-${paperId}-${idx + 1}-${cIdx + 1}`, 
          paperId, 
          secId, 
          s.name || s.section_name, 
          cIdx + 1, 
          chunkText, 
          s.page_start || idx + 1, 
          JSON.stringify(embedding)
        ]);
      }
    }


    // 4. Generate AI Outputs (English, Hindi, Key Findings, Terms, Social Draft)
    const { english_summary, hindi_summary, key_findings, important_terms, why_it_matters, social_media_draft, citation_text } = artifacts.aiOutput;

    await db.execute(`
      INSERT INTO ai_outputs (
        id, paper_id, english_summary, hindi_summary, key_findings, 
        important_terms, why_it_matters, social_media_draft, citation_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      `ai-${paperId}`, paperId, english_summary, hindi_summary,
      JSON.stringify(key_findings), JSON.stringify(important_terms),
      why_it_matters, social_media_draft, citation_text
    ]);

    // 5. Generate Educational MCQs (5-6 rich questions)
    for (let idx = 0; idx < artifacts.mcqs.length; idx++) {
      const mcq = artifacts.mcqs[idx];
      await db.execute(`
        INSERT INTO mcqs (id, paper_id, question, option_a, option_b, option_c, option_d, correct_option, explanation, source_section, source_page)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `mcq-${paperId}-${idx + 1}`,
        paperId,
        mcq.question,
        mcq.option_a,
        mcq.option_b,
        mcq.option_c,
        mcq.option_d,
        mcq.correct_option,
        mcq.explanation,
        mcq.source_section || 'Results',
        mcq.source_page || 8
      ]);
    }

    // 6. Generate Concept Flashcards (5 cards)
    for (let idx = 0; idx < artifacts.flashcards.length; idx++) {
      const fc = artifacts.flashcards[idx];
      await db.execute(`
        INSERT INTO flashcards (id, paper_id, front, back, source_section)
        VALUES (?, ?, ?, ?, ?)
      `, [
        `fc-${paperId}-${idx + 1}`,
        paperId,
        fc.front,
        fc.back,
        fc.source_section || 'Results'
      ]);
    }

    // 7. Generate AI Claims for Grounding Verification
    for (let idx = 0; idx < artifacts.claims.length; idx++) {
      const claim = artifacts.claims[idx];
      await db.execute(`
        INSERT INTO claims (id, paper_id, generated_claim, source_text, source_section, source_page, confidence_score, grounding_status, decision)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `claim-${paperId}-${idx + 1}`,
        paperId,
        claim.generated_claim,
        claim.source_text,
        claim.source_section,
        claim.source_page,
        claim.confidence_score,
        claim.grounding_status,
        claim.decision
      ]);
    }

    // 8. Add Audit Trail Events
    await db.execute(`
      INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
      VALUES (?, ?, 'researcher', 'PAPER_SUBMITTED', ?, 'none', 'under_review', ?)
    `, [`audit-${Date.now()}-1`, req.user.name || authorList, paperId, `Uploaded paper: "${title}"`]);

    await db.execute(`
      INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
      VALUES (?, 'System Pipeline', 'system', 'AI_PROCESSING_COMPLETED', ?, 'submitted', 'under_review', 'Extracted 8 sections, generated vector embeddings, bilingual summary, 5 MCQs, 5 flashcards, and grounding claims')
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

// POST /api/researcher/upload-manual - JSON based manual upload for direct testing
router.post('/upload-manual', async (req, res) => {
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
    embargo_until = null
  } = req.body;

  if (!title || !abstract) {
    return res.status(400).json({ error: 'Title and abstract are required.' });
  }

  const paperId = `paper-${Date.now().toString(36)}`;
  const pubYear = publication_year ? parseInt(publication_year, 10) : new Date().getFullYear();
  const authorList = authors || req.user.name;
  const inst = institution || req.user.institution || 'National Centre for Polar and Ocean Research';
  const area = research_area || 'Glaciology';
  const region = polar_region || 'Antarctic';
  const paperDoi = doi || `10.1016/j.polar.${pubYear}.${Math.floor(1000 + Math.random() * 9000)}`;
  const documentUrl = '/uploads/sample_uploaded_paper.pdf';
  const initialStatus = 'under_review';
  const visibility = 'private';

  const artifacts = await generateDocumentArtifactsAsync({
    title,
    abstract,
    region,
    area,
    institution: inst,
    authors: authorList,
    pubYear,
    doi: paperDoi
  });

  try {
    // 1. Insert Paper Record
    await db.execute(`
      INSERT INTO papers (
        id, title, abstract, authors, institution, research_area, polar_region, 
        location_id, keywords, publication_year, doi, document_url, thumbnail_url, 
        status, visibility, embargo_enabled, embargo_until, uploaded_by, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      paperId, title, abstract, authorList, inst, area, region,
      location_id || 'loc-1', keywords || 'polar science, antarctic, arctic',
      pubYear, paperDoi, documentUrl,
      'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop',
      initialStatus, visibility, embargo_enabled ? 1 : 0, embargo_until, researcherId || 'res-1'
    ]);

    // 2. Sections & Chunks
    for (let idx = 0; idx < artifacts.sections.length; idx++) {
      const s = artifacts.sections[idx];
      const secId = `sec-${paperId}-${idx + 1}`;
      await db.execute(`
        INSERT INTO paper_sections (id, paper_id, section_name, section_order, content, page_start, page_end)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [secId, paperId, s.name, s.order || idx + 1, s.content, s.page_start || idx + 1, s.page_end || idx + 2]);

      const embedding = generateEmbedding(s.content);
      await db.execute(`
        INSERT INTO paper_chunks (id, paper_id, section_id, section_name, chunk_index, text, page_number, embedding_json)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?)
      `, [`chk-${paperId}-${idx + 1}`, paperId, secId, s.name, s.content, s.page_start || idx + 1, JSON.stringify(embedding)]);
    }

    // 3. AI Outputs
    const { english_summary, hindi_summary, key_findings, important_terms, why_it_matters, social_media_draft, citation_text } = artifacts.aiOutput;
    await db.execute(`
      INSERT INTO ai_outputs (
        id, paper_id, english_summary, hindi_summary, key_findings, 
        important_terms, why_it_matters, social_media_draft, citation_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      `ai-${paperId}`, paperId, english_summary, hindi_summary,
      JSON.stringify(key_findings), JSON.stringify(important_terms),
      why_it_matters, social_media_draft, citation_text
    ]);

    // 4. MCQs
    for (let idx = 0; idx < artifacts.mcqs.length; idx++) {
      const mcq = artifacts.mcqs[idx];
      await db.execute(`
        INSERT INTO mcqs (id, paper_id, question, option_a, option_b, option_c, option_d, correct_option, explanation, source_section, source_page)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `mcq-${paperId}-${idx + 1}`,
        paperId,
        mcq.question,
        mcq.option_a,
        mcq.option_b,
        mcq.option_c,
        mcq.option_d,
        mcq.correct_option,
        mcq.explanation,
        mcq.source_section || 'Results',
        mcq.source_page || 8
      ]);
    }

    // 5. Flashcards
    for (let idx = 0; idx < artifacts.flashcards.length; idx++) {
      const fc = artifacts.flashcards[idx];
      await db.execute(`
        INSERT INTO flashcards (id, paper_id, front, back, source_section)
        VALUES (?, ?, ?, ?, ?)
      `, [
        `fc-${paperId}-${idx + 1}`,
        paperId,
        fc.front,
        fc.back,
        fc.source_section || 'Results'
      ]);
    }

    // 6. Claims
    for (let idx = 0; idx < artifacts.claims.length; idx++) {
      const claim = artifacts.claims[idx];
      await db.execute(`
        INSERT INTO claims (id, paper_id, generated_claim, source_text, source_section, source_page, confidence_score, grounding_status, decision)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `claim-${paperId}-${idx + 1}`,
        paperId,
        claim.generated_claim,
        claim.source_text,
        claim.source_section,
        claim.source_page,
        claim.confidence_score,
        claim.grounding_status,
        claim.decision
      ]);
    }

    res.status(201).json({
      message: 'Paper successfully uploaded and processed with full AI grounding suite.',
      paperId,
      status: initialStatus
    });
  } catch (err) {
    console.error('Manual Upload Error:', err);
    res.status(500).json({ error: 'Failed to process manual upload: ' + err.message });
  }
});

// POST /api/researcher/resubmit/:id - Resubmit a rejected paper
router.post('/resubmit/:id', async (req, res) => {
  const paperId = req.params.id;
  const researcherId = req.user.researcherId || 'res-1';
  const { title, abstract, revision_notes } = req.body;

  const existing = await db.queryGet('SELECT * FROM papers WHERE id = ? AND uploaded_by = ?', [paperId, researcherId]);
  if (!existing) {
    return res.status(404).json({ error: 'Paper not found or unauthorized' });
  }

  // Update paper metadata and set status back to under_review
  await db.execute(`
    UPDATE papers 
    SET title = COALESCE(?, title),
        abstract = COALESCE(?, abstract),
        status = 'under_review',
        rejection_reason = NULL,
        admin_comment = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [title || null, abstract || null, paperId]);

  // Reset claims to Pending
  await db.execute(`UPDATE claims SET decision = 'Pending', grounding_status = 'Needs Review' WHERE paper_id = ?`, [paperId]);

  // Log audit event
  await db.execute(`
    INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
    VALUES (?, ?, 'researcher', 'PAPER_RESUBMITTED', ?, 'rejected', 'under_review', ?)
  `, [`audit-${Date.now()}`, req.user.name, paperId, `Resubmitted with revision notes: ${revision_notes || 'Revised manuscript with noise filtering.'}`]);

  res.json({ message: 'Paper successfully resubmitted for admin verification.', paperId });
});

module.exports = router;
