const express = require('express');
const router = express.Router();
const db = require('../db/db.js');

// GET /api/media - Dissemination media (Stories, Infographics, Images, News)
router.get('/', (req, res) => {
  const { type, region } = req.query;

  let sql = `
    SELECT 
      m.*, l.name as location_name, p.title as related_paper_title
    FROM media m
    LEFT JOIN locations l ON m.location_id = l.id
    LEFT JOIN papers p ON m.related_paper_id = p.id
    WHERE m.status = 'Published'
  `;
  const params = [];

  if (type && type !== 'All') {
    sql += ` AND m.type = ?`;
    params.push(type);
  }

  if (region && region !== 'All') {
    sql += ` AND m.region = ?`;
    params.push(region);
  }

  sql += ` ORDER BY m.publication_date DESC`;

  const items = db.queryAll(sql, params);
  res.json({ media: items });
});

module.exports = router;
