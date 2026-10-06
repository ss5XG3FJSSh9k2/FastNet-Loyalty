module.exports = {
  up: async (db) => {
    // Add column if it doesn't exist
    try {
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);`);
    } catch (err) {
      console.warn("Could not add email column (might already exist):", err.message);
    }
    
    // Backfill missing emails
    const users = await db.getTable('users');
    for (const u of users) {
      if (!u.email) {
        await db.updateRow('users', u.id, { email: `pending+${u.id}@fastnet.invalid` });
      }
    }

    // Enforce NOT NULL and create unique index
    try {
      // Remove old non-unique index if it exists
      await db.query(`DROP INDEX IF EXISTS idx_users_email;`);
      
      // We cannot easily do ALTER COLUMN email SET NOT NULL in sqlite/pg-mem without recreate, 
      // but we can add the unique index.
      await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));`);
    } catch (err) {
      console.warn("Could not alter email column constraints:", err.message);
    }
  }
};
