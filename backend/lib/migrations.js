const fs = require('fs');
const path = require('path');

async function runMigrations(db) {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') || f.endsWith('.js'))
    .sort();

  for (const file of files) {
    const sqlPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    if (file.endsWith('.sql')) {
      // Split on semicolons for pg-mem or execute single block for pg
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        try {
          await db.query(stmt);
        } catch (err) {
          if (!err.message.includes('NotSupported') && !err.message.includes('already exists') && !err.message.includes('Syntax error') && !err.message.includes('failed to parse')) {
            console.warn('[Migration warning]:', err.message);
          }
        }
      }
    } else if (file.endsWith('.js')) {
      try {
        const migrationObj = require(sqlPath);
        if (typeof migrationObj.up === 'function') {
          await migrationObj.up(db);
        }
      } catch (err) {
        console.warn(`[Migration warning] JS execution failed for ${file}:`, err.message);
      }
    }
  }
}

module.exports = {
  runMigrations
};
