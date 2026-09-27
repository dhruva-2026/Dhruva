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

async function checkExpiredEmbargoes() {
  try {
    const expired = await db.queryAll(`
      SELECT id, title, embargo_until 
      FROM papers 
      WHERE status = 'embargoed' 
        AND embargo_until IS NOT NULL 
        AND embargo_until <= CURRENT_TIMESTAMP
    `);

    if (expired.length > 0) {
      console.log(`🔍 Found ${expired.length} expired embargo paper(s) to auto-release.`);
      for (const paper of expired) {
        await db.execute(`
          UPDATE papers 
          SET status = 'published', 
              visibility = 'public', 
              embargo_enabled = 0,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [paper.id]);

        await db.execute(`
          UPDATE embargoes 
          SET status = 'Released', 
              updated_at = CURRENT_TIMESTAMP 
          WHERE paper_id = ?
        `, [paper.id]);

        await db.execute(`
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
