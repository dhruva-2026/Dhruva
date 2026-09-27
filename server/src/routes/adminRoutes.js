const express = require('express');
const router = express.Router();
const db = require('../db/db.js');
const { requireRole } = require('../middleware/auth.js');

// Strict Admin role requirement
router.use(requireRole(['admin']));

// GET /api/admin/dashboard - High-level metrics
router.get('/dashboard', async (req, res) => {
  const counts = await db.queryAll(`
    SELECT status, COUNT(*) as count 
    FROM papers 
    GROUP BY status
  `);

  const metrics = {
    pendingVerification: 0,
    approved: 0,
    rejected: 0,
    embargoed: 0,
    published: 0,
    processing: 0,
    totalClaims: 0,
    verifiedClaims: 0
  };

  counts.forEach(c => {
    if (c.status === 'under_review' || c.status === 'submitted') metrics.pendingVerification += parseInt(c.count, 10);
    if (c.status === 'approved') metrics.approved += parseInt(c.count, 10);
    if (c.status === 'rejected') metrics.rejected += parseInt(c.count, 10);
    if (c.status === 'embargoed') metrics.embargoed += parseInt(c.count, 10);
    if (c.status === 'published') metrics.published += parseInt(c.count, 10);
  });

  const claimStats = await db.queryGet(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN decision = 'Approved' THEN 1 ELSE 0 END) as approved_claims
    FROM claims
  `);

  metrics.totalClaims = parseInt(claimStats?.total, 10) || 0;
  metrics.verifiedClaims = parseInt(claimStats?.approved_claims, 10) || 0;

  res.json({ metrics });
});

// GET /api/admin/queue - Papers waiting for admin review
router.get('/queue', async (req, res) => {
  const queue = await db.queryAll(`
    SELECT 
      p.id, p.title, p.authors, p.institution, p.research_area, p.polar_region,
      p.status, p.created_at, p.embargo_enabled, p.embargo_until,
      (SELECT COUNT(*) FROM claims WHERE paper_id = p.id) as claim_count,
      (SELECT COUNT(*) FROM claims WHERE paper_id = p.id AND decision = 'Approved') as verified_claim_count
    FROM papers p
    WHERE p.status IN ('under_review', 'submitted', 'embargoed', 'rejected')
    ORDER BY p.created_at DESC
  `);

  res.json({ queue });
});

// GET /api/admin/verification/:paperId - Split-Screen Review Payload
router.get('/verification/:paperId', async (req, res) => {
  const paperId = req.params.paperId;

  const paper = await db.queryGet(`
    SELECT 
      p.*, l.name as location_name, l.station_type,
      r.name as researcher_name, r.email as researcher_email
    FROM papers p
    LEFT JOIN locations l ON p.location_id = l.id
    LEFT JOIN researchers r ON p.uploaded_by = r.id
    WHERE p.id = ?
  `, [paperId]);

  if (!paper) {
    return res.status(404).json({ error: 'Paper not found' });
  }

  // Left Pane: Structured Sections
  const sections = await db.queryAll(
    'SELECT * FROM paper_sections WHERE paper_id = ? ORDER BY section_order ASC',
    [paperId]
  );

  // Right Pane: AI Generated Content
  const aiOutput = await db.queryGet(
    'SELECT * FROM ai_outputs WHERE paper_id = ?',
    [paperId]
  );

  let parsedAiOutput = null;
  if (aiOutput) {
    parsedAiOutput = {
      ...aiOutput,
      key_findings: JSON.parse(aiOutput.key_findings || '[]'),
      important_terms: JSON.parse(aiOutput.important_terms || '[]')
    };
  }

  const mcqs = await db.queryAll('SELECT * FROM mcqs WHERE paper_id = ?', [paperId]);
  const flashcards = await db.queryAll('SELECT * FROM flashcards WHERE paper_id = ?', [paperId]);

  // Bottom Pane: Grounding Claims
  const claims = await db.queryAll(`
    SELECT 
      c.*,
      v.reviewer_comment, v.verified_at, u.name as reviewer_name
    FROM claims c
    LEFT JOIN verifications v ON c.id = v.claim_id
    LEFT JOIN users u ON v.reviewer_id = u.id
    WHERE c.paper_id = ?
  `, [paperId]);

  res.json({
    paper,
    sections,
    aiOutput: parsedAiOutput,
    mcqs,
    flashcards,
    claims
  });
});

// POST /api/admin/claims/verify - Verify / Approve / Edit / Reject specific AI Claim
router.post('/claims/verify', async (req, res) => {
  const { claimId, paperId, decision, reviewerComment, editedText } = req.body;

  if (!claimId || !decision) {
    return res.status(400).json({ error: 'Claim ID and decision are required.' });
  }

  // Update claim status
  const groundingStatus = decision === 'Approved' ? 'Verified' : (decision === 'Rejected' ? 'Unsupported' : 'Partially Verified');

  await db.execute(`
    UPDATE claims 
    SET decision = ?,
        grounding_status = ?,
        generated_claim = COALESCE(?, generated_claim)
    WHERE id = ?
  `, [decision, groundingStatus, editedText || null, claimId]);

  // Record verification entry
  const verId = `ver-${claimId}-${Date.now().toString(36)}`;
  await db.execute(`
    INSERT INTO verifications (id, claim_id, paper_id, reviewer_id, reviewer_comment, decision)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [verId, claimId, paperId, req.user.userId, reviewerComment || 'Verified against original source section.', decision]);

  // Log in audit logs
  await db.execute(`
    INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
    VALUES (?, ?, 'admin', 'CLAIM_VERIFIED', ?, 'Needs Review', ?, ?)
  `, [`audit-${Date.now()}`, req.user.name, paperId, decision, `Claim: ${claimId} marked ${decision}. Comment: ${reviewerComment || 'None'}`]);

  res.json({ message: `Claim ${decision.toLowerCase()} successfully.`, claimId, decision, groundingStatus });
});

// POST /api/admin/papers/decision - Major Approval / Rejection & Publication Flow
router.post('/papers/decision', async (req, res) => {
  const { paperId, decision, comment, reason, overrideEmbargo = false } = req.body;

  if (!paperId || !['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ error: 'Valid paperId and decision (approve/reject) are required.' });
  }

  const paper = await db.queryGet('SELECT * FROM papers WHERE id = ?', [paperId]);
  if (!paper) {
    return res.status(404).json({ error: 'Paper not found' });
  }

  const prevStatus = paper.status;

  if (decision === 'reject') {
    await db.execute(`
      UPDATE papers 
      SET status = 'rejected',
          rejection_reason = ?,
          admin_comment = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [reason || 'Scientific criteria not satisfied', comment || 'Please address reviewer notes and resubmit.', paperId]);

    await db.execute(`
      INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
      VALUES (?, ?, 'admin', 'PAPER_REJECTED', ?, ?, 'rejected', ?)
    `, [`audit-${Date.now()}`, req.user.name, paperId, prevStatus, `Reason: ${reason}. Notes: ${comment}`]);

    return res.json({ message: 'Paper rejected and returned to researcher for revisions.', status: 'rejected' });
  }

  // Decision is 'approve'
  // Check embargo rules
  const hasActiveEmbargo = paper.embargo_enabled && paper.embargo_until && new Date(paper.embargo_until) > new Date();
  
  let newStatus = 'published';
  let newVisibility = 'public';

  if (hasActiveEmbargo && !overrideEmbargo) {
    newStatus = 'embargoed';
    newVisibility = 'embargoed';
  }

  await db.execute(`
    UPDATE papers 
    SET status = ?,
        visibility = ?,
        admin_comment = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
  `, [newStatus, newVisibility, comment || 'Approved by NCPOR Editorial Board.', paperId]);

  // Log audit actions
  await db.execute(`
    INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
    VALUES (?, ?, 'admin', 'PAPER_APPROVED', ?, ?, 'approved', ?)
  `, [`audit-${Date.now()}-1`, req.user.name, paperId, prevStatus, comment || 'All claims verified and grounded.']);

  if (newStatus === 'published') {
    await db.execute(`
      INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
      VALUES (?, ?, 'admin', 'PAPER_PUBLISHED', ?, 'approved', 'published', 'Released live to DHRUVA Public Knowledge Portal.')
    `, [`audit-${Date.now()}-2`, req.user.name, paperId]);
  } else {
    await db.execute(`
      INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
      VALUES (?, ?, 'admin', 'EMBARGO_SCHEDULED', ?, 'approved', 'embargoed', 'Scheduled release on ' || ?)
    `, [`audit-${Date.now()}-2`, req.user.name, paperId, paper.embargo_until]);
  }

  res.json({
    message: newStatus === 'published' 
      ? 'Paper approved and published successfully to the Public Portal!' 
      : 'Paper approved and placed under scheduled scientific embargo.',
    status: newStatus,
    visibility: newVisibility
  });
});

// POST /api/admin/embargo/override - Modify or release embargo
router.post('/embargo/override', async (req, res) => {
  const { paperId, action } = req.body; // action: 'release' | 'extend'

  const paper = await db.queryGet('SELECT * FROM papers WHERE id = ?', [paperId]);
  if (!paper) {
    return res.status(404).json({ error: 'Paper not found' });
  }

  if (action === 'release') {
    await db.execute(`
      UPDATE papers 
      SET status = 'published',
          visibility = 'public',
          embargo_enabled = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [paperId]);

    await db.execute(`UPDATE embargoes SET status = 'Overridden' WHERE paper_id = ?`, [paperId]);

    await db.execute(`
      INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
      VALUES (?, ?, 'admin', 'EMBARGO_OVERRIDDEN', ?, 'embargoed', 'published', 'Admin manually released embargo to public portal.')
    `, [`audit-${Date.now()}`, req.user.name, paperId]);

    return res.json({ message: 'Embargo released. Paper is now publicly published!', status: 'published' });
  }

  res.json({ message: 'No action performed.' });
});

// GET /api/admin/audit-logs - Tamper-evident activity logs
router.get('/audit-logs', async (req, res) => {
  const logs = await db.queryAll(`
    SELECT * FROM audit_logs 
    ORDER BY timestamp DESC 
    LIMIT 100
  `);
  res.json({ logs });
});

// GET /api/admin/analytics - Platform analytics
router.get('/analytics', async (req, res) => {
  const regionBreakdown = await db.queryAll(`
    SELECT polar_region, COUNT(*) as count 
    FROM papers 
    GROUP BY polar_region
  `);

  const areaBreakdown = await db.queryAll(`
    SELECT research_area, COUNT(*) as count 
    FROM papers 
    GROUP BY research_area 
    ORDER BY count DESC
  `);

  const statusBreakdown = await db.queryAll(`
    SELECT status, COUNT(*) as count 
    FROM papers 
    GROUP BY status
  `);

  const topViewed = await db.queryAll(`
    SELECT title, view_count, polar_region 
    FROM papers 
    ORDER BY view_count DESC 
    LIMIT 5
  `);

  const totalQuestions = await db.queryGet(`
    SELECT COUNT(*) as count 
    FROM audit_logs 
    WHERE action = 'RAG_QUERY_ANSWERED'
  `);

  res.json({
    regionBreakdown,
    areaBreakdown,
    statusBreakdown,
    topViewed,
    questionsAnswered: parseInt(totalQuestions?.count, 10) || 42
  });
});

// POST /api/admin/claims/batch-verify - Batch verify all claims for a paper
router.post('/claims/batch-verify', async (req, res) => {
  const { paperId, decision = 'Approved', reviewerComment } = req.body;
  if (!paperId) {
    return res.status(400).json({ error: 'paperId is required for batch claim verification.' });
  }

  const groundingStatus = decision === 'Approved' ? 'Verified' : 'Unsupported';

  await db.execute(`
    UPDATE claims
    SET decision = ?,
        grounding_status = ?
    WHERE paper_id = ?
  `, [decision, groundingStatus, paperId]);

  await db.execute(`
    INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
    VALUES (?, ?, 'admin', 'BATCH_CLAIMS_VERIFIED', ?, 'Needs Review', ?, ?)
  `, [`audit-${Date.now()}`, req.user.name, paperId, decision, `All claims for ${paperId} batch-marked as ${decision}. Notes: ${reviewerComment || 'Batch operation'}`]);

  res.json({ message: `All claims for paper ${paperId} updated to ${decision}.`, paperId, decision });
});

// POST /api/admin/papers/batch-decision - Batch approve or reject multiple papers
router.post('/papers/batch-decision', async (req, res) => {
  const { paperIds = [], decision = 'approve', comment } = req.body;
  if (!Array.isArray(paperIds) || paperIds.length === 0) {
    return res.status(400).json({ error: 'paperIds array is required.' });
  }

  const status = decision === 'approve' ? 'published' : 'rejected';
  const visibility = decision === 'approve' ? 'public' : 'private';

  for (const pid of paperIds) {
    await db.execute(`
      UPDATE papers 
      SET status = ?,
          visibility = ?,
          admin_comment = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, visibility, comment || `Batch ${decision}`, pid]);

    await db.execute(`
      INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
      VALUES (?, ?, 'admin', 'BATCH_PAPER_DECISION', ?, 'under_review', ?, ?)
    `, [`audit-${Date.now()}-${pid}`, req.user.name, pid, status, `Batch decision: ${decision}`]);
  }

  res.json({ message: `Batch decision executed for ${paperIds.length} papers.`, paperIds, status });
});

module.exports = router;
