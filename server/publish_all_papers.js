/**
 * Script to publish all research papers from the backup seed
 * Makes all 20 papers visible in the Explore Research section
 */
const db = require('./src/db/db.js');

console.log('Publishing all research papers from backup...');

// Publish papers that are under_review, draft, or rejected
const r1 = db.execute(
  "UPDATE papers SET status = 'published', visibility = 'public', embargo_enabled = 0, embargo_until = NULL WHERE status IN ('under_review', 'draft', 'rejected')"
);
console.log('Released under_review/draft/rejected papers');

// Release embargoed papers
const r2 = db.execute(
  "UPDATE papers SET status = 'published', visibility = 'public', embargo_enabled = 0, embargo_until = NULL WHERE status = 'embargoed'"
);
console.log('Released embargoed papers');

// Verify
const count = db.queryGet("SELECT COUNT(*) as cnt FROM papers WHERE status = 'published'");
console.log('Total published papers now:', count.cnt);

const all = db.queryAll('SELECT id, title, status, embargo_enabled FROM papers ORDER BY id');
all.forEach(p => {
  console.log(p.id, '|', p.status, '| embargo:', p.embargo_enabled, '|', p.title.substring(0, 55));
});
