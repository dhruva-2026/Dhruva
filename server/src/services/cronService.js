const cron = require('node-cron');
const db = require('../db/db.js');

function initCronJobs() {
  // Check every hour at minute 0 for expired embargoes
  // In addition, run an immediate check on startup
  checkExpiredEmbargoes();

  cron.schedule('0 * * * *', () => {
    checkExpiredEmbargoes();
  });

  console.log('⏰ DHRUVA Scheduled Jobs Initialized (Hourly Embargo Auto-Release)');
}

function checkExpiredEmbargoes() {
  try {
    const expired = db.queryAll(`
      SELECT id, title, embargo_until 
      FROM papers 
      WHERE status = 'embargoed' 
        AND embargo_until IS NOT NULL 
        AND embargo_until <= datetime('now')
    `);

    if (expired.length > 0) {
      console.log(`🔍 Found ${expired.length} expired embargo paper(s) to auto-release.`);
      for (const paper of expired) {
        db.execute(`
          UPDATE papers 
          SET status = 'published', 
              visibility = 'public', 
              embargo_enabled = 0,
              updated_at = datetime('now')
          WHERE id = ?
        `, [paper.id]);

        db.execute(`
          UPDATE embargoes 
          SET status = 'Released', 
              updated_at = datetime('now') 
          WHERE paper_id = ?
        `, [paper.id]);

        db.execute(`
          INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details)
          VALUES (?, 'DHRUVA System Scheduler', 'system', 'EMBARGO_AUTO_RELEASED', ?, 'embargoed', 'published', ?)
        `, [
          `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          paper.id,
          `Scientific embargo automatically expired on ${paper.embargo_until} and was released to the Public Portal.`
        ]);

        console.log(`  ✓ Auto-released: "${paper.title}" (${paper.id})`);
      }
    }
  } catch (err) {
    console.error('Error during scheduled embargo check:', err);
  }
}

module.exports = {
  initCronJobs,
  checkExpiredEmbargoes
};
