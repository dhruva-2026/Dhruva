const db = require('./db.js');

async function migrateUserProfile() {
  console.log('🔄 Running User Profile & Account System Migration on PostgreSQL...');

  const migrationSql = `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth VARCHAR(32);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'active';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS research_domain VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

    -- Ensure default status for existing users is active
    UPDATE users SET status = 'active' WHERE status IS NULL;
  `;

  await db.exec(migrationSql);

  // Update sample users with representative initial profile metadata
  await db.execute(
    `UPDATE users SET 
      phone = '+91 98765 43210', 
      date_of_birth = '1982-06-15', 
      bio = 'Senior Polar Scientist specializing in Cryosphere Dynamics, Antarctic Ice Sheet Mass Balance, and IndARC Arctic Observatory moored sensor arrays.', 
      research_domain = 'Glaciology & Cryosphere Dynamics' 
    WHERE role = 'researcher' AND (phone IS NULL OR bio IS NULL)`
  );

  await db.execute(
    `UPDATE users SET 
      phone = '+91 98111 22334', 
      date_of_birth = '1975-03-22', 
      bio = 'Senior Reviewer and Administrative Scientific Officer, Ministry of Earth Sciences (MoES) / NCPOR Portal Governance.', 
      research_domain = 'Polar Science Governance & Ethics' 
    WHERE role = 'admin' AND (phone IS NULL OR bio IS NULL)`
  );

  await db.execute(
    `UPDATE users SET 
      phone = '+91 91234 56789', 
      date_of_birth = '1998-11-05', 
      bio = 'Polar science student and public enthusiast exploring cryosphere research and NCPOR publications.', 
      research_domain = 'Atmospheric & Oceanic Sciences' 
    WHERE role = 'public' AND (phone IS NULL OR bio IS NULL)`
  );

  const sample = await db.queryGet('SELECT id, name, email, phone, date_of_birth, role, institution, research_domain, bio, status, created_at FROM users LIMIT 1');
  console.log('✅ User Profile Schema Migration Completed Successfully!');
  console.log('📋 Sample User Record Structure:', sample);
}

if (require.main === module) {
  migrateUserProfile()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}

module.exports = migrateUserProfile;
