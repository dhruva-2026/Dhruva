/**
 * DHRUVA Project Backup Script
 * Creates a complete snapshot of the SQLite database and exports all tables to JSON.
 */
const fs = require('fs');
const path = require('path');
const db = require('./src/db/db.js');

const backupDir = path.join(__dirname, 'backup');
const rootBackupDir = path.join(__dirname, '..', 'backup');

[backupDir, rootBackupDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

console.log('📦 Starting DHRUVA project backup...');

// 1. Snapshot SQLite Database file
const sourceDb = path.join(__dirname, 'dhruva.sqlite');
if (fs.existsSync(sourceDb)) {
  fs.copyFileSync(sourceDb, path.join(backupDir, 'dhruva.sqlite.bak'));
  fs.copyFileSync(sourceDb, path.join(rootBackupDir, 'dhruva.sqlite.bak'));
  console.log('✓ SQLite database backed up to dhruva.sqlite.bak');
}

// 2. Export all data tables to JSON
const tables = [
  'papers', 'paper_sections', 'ai_outputs', 'mcqs', 
  'flashcards', 'claims', 'locations', 'researchers', 
  'users', 'media', 'embargoes', 'audit_logs'
];
const exportData = {};

for (const table of tables) {
  try {
    exportData[table] = db.queryAll('SELECT * FROM ' + table);
  } catch (e) {
    console.error('Error reading table ' + table + ':', e.message);
  }
}

const jsonBackup = JSON.stringify(exportData, null, 2);
fs.writeFileSync(path.join(backupDir, 'full_project_backup.json'), jsonBackup);
fs.writeFileSync(path.join(rootBackupDir, 'full_project_backup.json'), jsonBackup);
console.log(`✓ Exported ${tables.length} tables to full_project_backup.json`);

const manifest = {
  backupDate: new Date().toISOString(),
  totalPapers: exportData.papers ? exportData.papers.length : 0,
  tablesBackedUp: Object.keys(exportData),
  description: 'Complete backup of DHRUVA project database, papers, and knowledge assets'
};
const manifestJson = JSON.stringify(manifest, null, 2);
fs.writeFileSync(path.join(backupDir, 'backup_manifest.json'), manifestJson);
fs.writeFileSync(path.join(rootBackupDir, 'backup_manifest.json'), manifestJson);

console.log(`🎉 Backup completed successfully! Total research papers: ${manifest.totalPapers}`);
