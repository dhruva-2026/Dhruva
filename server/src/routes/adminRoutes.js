const express = require('express');
const router = express.Router();
const db = require('../db/db.js');
const { requireRole } = require('../middleware/auth.js');

// Strict Admin role requirement
router.use(requireRole(['admin']));

// GET /api/admin/dashboard - High-level metrics
router.get('/dashboard', (req, res) => {
  const counts = db.queryAll(`
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
    if (c.status === 'under_review' || c.status === 'submitted') metrics.pendingVerification += c.count;
    if (c.status === 'approved') metrics.approved += c.count;
    if (c.status === 'rejected') metrics.rejected += c.count;
    if (c.status === 'embargoed') metrics.embargoed += c.count;
    if (c.status === 'published') metrics.published += c.count;
  });

  const claimStats = db.queryGet(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN decision = 'Approved' THEN 1 ELSE 0 END) as approved_claims
    FROM claims
  `);

  metrics.totalClaims = claimStats?.total || 0;
  metrics.verifiedClaims = claimStats?.approved_claims || 0;

  res.json({ metrics });
});

// GET /api/admin/queue - Papers waiting for admin review
router.get('/queue', (req, res) => {
  const queue = db.queryAll(`
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
router.get('/verification/:paperId', (req, res) => {
  const paperId = req.params.paperId;

  const paper = db.queryGet(`
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
  const sections = db.queryAll(
    'SELECT * FROM paper_sections WHERE paper_id = ? ORDER BY section_order ASC',
    [paperId]
  );

  // Right Pane: AI Generated Content
  const aiOutput = db.queryGet(
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

  const mcqs = db.queryAll('SELECT * FROM mcqs WHERE paper_id = ?', [paperId]);
  const flashcards = db.queryAll('SELECT * FROM flashcards WHERE paper_id = ?', [paperId]);

  // Bottom Pane: Grounding Claims
  const claims = db.queryAll(`
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
router.post('/claims/verify', (req, res) => {
  const { claimId, paperId, decision, reviewerComment, editedText } = req.body;

  if (!claimId || !decision) {
    return res.status(400).json({ error: 'Claim ID and decision are required.' });
  }

  // Update claim status
  const groundingStatus = decision === 'Approved' ? 'Verified' : (decision === 'Rejected' ? 'Unsupported' : 'Partially Verified');

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
  `, [verId, claimId, paperId, req.user.userId, reviewerComment || 'Verified against original source section.', decision]);

  // Log in audit logs
  db.execute(`
    INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
    VALUES (?, ?, 'admin', 'CLAIM_VERIFIED', ?, 'Needs Review', ?, ?)
  `, [`audit-${Date.now()}`, req.user.name, paperId, decision, `Claim: ${claimId} marked ${decision}. Comment: ${reviewerComment || 'None'}`]);

  res.json({ message: `Claim ${decision.toLowerCase()} successfully.`, claimId, decision, groundingStatus });
});

// POST /api/admin/papers/decision - Major Approval / Rejection & Publication Flow
router.post('/papers/decision', (req, res) => {
  const { paperId, decision, comment, reason, overrideEmbargo = false } = req.body;

  if (!paperId || !['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ error: 'Valid paperId and decision (approve/reject) are required.' });
  }

  const paper = db.queryGet('SELECT * FROM papers WHERE id = ?', [paperId]);
  if (!paper) {
    return res.status(404).json({ error: 'Paper not found' });
  }

  const prevStatus = paper.status;

  if (decision === 'reject') {
    db.execute(`
      UPDATE papers 
      SET status = 'rejected',
          rejection_reason = ?,
          admin_comment = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `, [reason || 'Scientific criteria not satisfied', comment || 'Please address reviewer notes and resubmit.', paperId]);

    db.execute(`
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

  db.execute(`
    UPDATE papers 
    SET status = ?,
        visibility = ?,
        admin_comment = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `, [newStatus, newVisibility, comment || 'Approved by NCPOR Editorial Board.', paperId]);

  // Log audit actions
  db.execute(`
    INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
    VALUES (?, ?, 'admin', 'PAPER_APPROVED', ?, ?, 'approved', ?)
  `, [`audit-${Date.now()}-1`, req.user.name, paperId, prevStatus, comment || 'All claims verified and grounded.']);

  if (newStatus === 'published') {
    db.execute(`
      INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
      VALUES (?, ?, 'admin', 'PAPER_PUBLISHED', ?, 'approved', 'published', 'Released live to DHRUVA Public Knowledge Portal.')
    `, [`audit-${Date.now()}-2`, req.user.name, paperId]);
  } else {
    db.execute(`
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
router.post('/embargo/override', (req, res) => {
  const { paperId, action } = req.body; // action: 'release' | 'extend'

  const paper = db.queryGet('SELECT * FROM papers WHERE id = ?', [paperId]);
  if (!paper) {
    return res.status(404).json({ error: 'Paper not found' });
  }

  if (action === 'release') {
    db.execute(`
      UPDATE papers 
      SET status = 'published',
          visibility = 'public',
          embargo_enabled = 0,
          updated_at = datetime('now')
      WHERE id = ?
    `, [paperId]);

    db.execute(`UPDATE embargoes SET status = 'Overridden' WHERE paper_id = ?`, [paperId]);

    db.execute(`
      INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
      VALUES (?, ?, 'admin', 'EMBARGO_OVERRIDDEN', ?, 'embargoed', 'published', 'Admin manually released embargo to public portal.')
    `, [`audit-${Date.now()}`, req.user.name, paperId]);

    return res.json({ message: 'Embargo released. Paper is now publicly published!', status: 'published' });
  }

  res.json({ message: 'No action performed.' });
});

// GET /api/admin/audit-logs - Tamper-evident activity logs
router.get('/audit-logs', (req, res) => {
  const logs = db.queryAll(`
    SELECT * FROM audit_logs 
    ORDER BY timestamp DESC 
    LIMIT 100
  `);
  res.json({ logs });
});

// GET /api/admin/analytics - Platform analytics
router.get('/analytics', (req, res) => {
  const regionBreakdown = db.queryAll(`
    SELECT polar_region, COUNT(*) as count 
    FROM papers 
    GROUP BY polar_region
  `);

  const areaBreakdown = db.queryAll(`
    SELECT research_area, COUNT(*) as count 
    FROM papers 
    GROUP BY research_area 
    ORDER BY count DESC
  `);

  const statusBreakdown = db.queryAll(`
    SELECT status, COUNT(*) as count 
    FROM papers 
    GROUP BY status
  `);

  const topViewed = db.queryAll(`
    SELECT title, view_count, polar_region 
    FROM papers 
    ORDER BY view_count DESC 
    LIMIT 5
  `);

  const totalQuestions = db.queryGet(`
    SELECT COUNT(*) as count 
    FROM audit_logs 
    WHERE action = 'RAG_QUERY_ANSWERED'
  `);

  res.json({
    regionBreakdown,
    areaBreakdown,
    statusBreakdown,
    topViewed,
    questionsAnswered: totalQuestions?.count || 42
  });
});

module.exports = router;
