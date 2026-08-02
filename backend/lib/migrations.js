const fs = require('fs');
const path = require('path');

async function runMigrations(db) {
  const sqlPath = path.join(__dirname, 'migrations', '001-initial.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  // Split on semicolons for pg-mem or execute single block for pg
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    try {
      await db.query(stmt);
    } catch (err) {
      if (!err.message.includes('NotSupported') && !err.message.includes('already exists')) {
        console.warn('[Migration warning]:', err.message);
      }
    }
  }
}

module.exports = {
  runMigrations
};
