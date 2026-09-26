const express = require('express');
const router = express.Router();
const db = require('../db/db.js');

// GET /api/locations - All polar stations & research locations
router.get('/', (req, res) => {
  const locations = db.queryAll(`
    SELECT 
      l.*,
      (SELECT COUNT(*) FROM papers WHERE location_id = l.id AND status = 'published') as paper_count
    FROM locations l
    ORDER BY l.region ASC, l.name ASC
  `);

  res.json({ locations });
});

// GET /api/locations/:id - Location detail with published papers
router.get('/:id', (req, res) => {
  const loc = db.queryGet('SELECT * FROM locations WHERE id = ?', [req.params.id]);
  if (!loc) {
    return res.status(404).json({ error: 'Location not found' });
  }

  const papers = db.queryAll(`
    SELECT id, title, authors, research_area, publication_year, doi, view_count, is_demo
    FROM papers
    WHERE location_id = ? AND status = 'published'
    ORDER BY publication_year DESC
  `, [loc.id]);

  res.json({ location: loc, papers });
});

module.exports = router;
