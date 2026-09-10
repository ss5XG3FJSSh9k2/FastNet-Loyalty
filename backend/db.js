const { Pool } = require('pg');
const migrations = require('./lib/migrations');
const seedRunner = require('./lib/seed-runner');

let pool = null;
let isMemMode = false;

async function getClientOrPool(client) {
  if (client) return client;
  if (!pool) {
    await init();
  }
  return pool;
}

function normalizeRow(row) {
  if (!row) return row;
  const res = { ...row };
  if (res.stock_quantity !== undefined && (res.stock_qty === undefined || res.stock_qty === null)) {
    res.stock_qty = parseInt(res.stock_quantity, 10) || 0;
  }
  if (res.stock_qty !== undefined && (res.stock_quantity === undefined || res.stock_quantity === null)) {
    res.stock_quantity = parseInt(res.stock_qty, 10) || 0;
  }
  for (const key of Object.keys(res)) {
    if (typeof res[key] === 'string') {
      // Parse JSONB strings if needed
      if ((res[key].startsWith('{') && res[key].endsWith('}')) || (res[key].startsWith('[') && res[key].endsWith(']'))) {
        try {
          res[key] = JSON.parse(res[key]);
        } catch (e) {
          // keep string
        }
      }
    }
    if (res[key] instanceof Date) {
      res[key] = res[key].toISOString();
    }
    // Parse numeric fields if returned as string from postgres
    if (['price', 'cost_price', 'amount', 'total_amount', 'platform_commission', 'points_credited', 'stockist_payout', 'selling_price_at_upload', 'cost_price_at_upload', 'rupees_value', 'stockist_reinvest_pct', 'points_from_pot_pct', 'partner_redemption_cut_pct'].includes(key)) {
      if (res[key] !== null && res[key] !== undefined) {
        res[key] = parseFloat(res[key]);
      }
    }
  }
  return res;
}

async function query(sql, params = [], client = null) {
  const executor = await getClientOrPool(client);
  const result = await executor.query(sql, params);
  return result;
}

const REFERRAL_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRandomReferralCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += REFERRAL_CHARS.charAt(Math.floor(Math.random() * REFERRAL_CHARS.length));
  }
  return code;
}

async function backfillReferralCodes(dbInterface) {
  const users = await dbInterface.getTable('users');
  const existingCodes = new Set(users.map(u => u.referral_code).filter(Boolean));
  for (const user of users) {
    if (!user.referral_code) {
      let code = generateRandomReferralCode();
      while (existingCodes.has(code)) {
        code = generateRandomReferralCode();
      }
      existingCodes.add(code);
      await dbInterface.updateRow('users', user.id, { referral_code: code });
    }
  }
}

async function dedupeStockists(dbInterface) {
  try {
    const stockists = await dbInterface.getTable('stockists');
    if (!stockists || stockists.length === 0) return;

    const groups = new Map();
    for (const s of stockists) {
      const key = s.phone || s.contact_phone || s.user_id || s.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    }

    let changed = false;
    const keptStockists = [];

    for (const [key, group] of groups.entries()) {
      if (group.length === 1) {
        keptStockists.push(group[0]);
        continue;
      }

      changed = true;
      let kept = group.find(s => s.vendor_id);
      if (!kept) {
        group.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        kept = group[0];
      }

      const dropped = group.filter(s => s.id !== kept.id);
      const droppedIds = dropped.map(s => s.id);

      const tablesToRepoint = [
        'products', 'orders', 'order_items', 'stockist_inventory', 'stockist_vendors',
        'stockist_commission_rates', 'points_earn_config', 'commission_config',
        'stockist_cod_commissions', 'split_payouts'
      ];

      for (const table of tablesToRepoint) {
        try {
          const rows = await dbInterface.getTable(table);
          let tableModified = false;
          for (const row of rows) {
            if (row.stockist_id && droppedIds.includes(row.stockist_id)) {
              row.stockist_id = kept.id;
              tableModified = true;
            }
          }
          if (tableModified) {
            await dbInterface.saveTable(table, rows);
          }
        } catch (err) {
          // ignore
        }
      }

      for (const d of dropped) {
        if (!kept.vendor_id && d.vendor_id) kept.vendor_id = d.vendor_id;
        if (!kept.name && d.name) kept.name = d.name;
        if (!kept.phone && d.phone) kept.phone = d.phone;
      }

      keptStockists.push(kept);
    }

    if (changed) {
      await dbInterface.saveTable('stockists', keptStockists);
    }
  } catch (e) {
    console.warn('[Dedupe warning]:', e.message);
  }
}

async function normalizeClosingTimes(dbInterface) {
  try {
    const stockists = await dbInterface.getTable('stockists');
    let changed = false;
    for (const s of stockists) {
      if (s.closing_time === '24:00') {
        s.closing_time = '23:59';
        changed = true;
      }
    }
    if (changed) {
      await dbInterface.saveTable('stockists', stockists);
    }
  } catch (e) {
    // ignore
  }
}

let initPromise = null;

async function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
      });
      isMemMode = false;
    } else {
      process.env.POSTGRES_MODE = process.env.POSTGRES_MODE || 'mem';
      const { newDb } = require('pg-mem');
      const memDb = newDb();
      const adapter = memDb.adapters.createPg();
      pool = new adapter.Pool();
      isMemMode = true;
    }

    const dbInterface = { query, getTable, insertRow, updateRow, deleteRow };
    await migrations.runMigrations(dbInterface);

    const seedMode = process.env.SEED_MODE || 'production';
    if (seedMode === 'production') {
      console.log('[Seed] SEED_MODE=production — starting with an empty database.');
    } else {
      console.log(`[Seed] SEED_MODE=${seedMode} — starting with test seed data.`);
    }

    // Check if DB has users
    const checkRes = await query('SELECT COUNT(*) as count FROM users');
    const count = parseInt(checkRes.rows[0].count, 10);
    if (count === 0 && seedMode === 'test') {
      await seedRunner.seedDatabase(dbInterface);
      await backfillReferralCodes(dbInterface);
    }

    await dedupeStockists(dbInterface);
    await normalizeClosingTimes(dbInterface);
  })();
  return initPromise;
}

async function resetForTest() {
  const tables = [
    'tenants', 'users', 'regions', 'stockists', 'products', 'orders', 'points_ledger',
    'inventory', 'stockist_inventory', 'order_items', 'split_payouts', 'payment_ledger',
    'cod_commission_ledger', 'commission_rates', 'stockist_commission_rates',
    'points_earn_config', 'anomaly_logs', 'stockist_vendors', 'vendors', 'partner_leads',
    'fraud_reports', 'admin_audit_log', 'commission_config', 'product_bill_photos',
    'partners', 'partner_regions', 'partner_packages', 'partner_users',
    'customer_partner_bindings', 'redemption_approvals', 'partner_feedback',
    'partner_notifications', 'feedback_reports', 'user_blacklist', 'support_tickets',
    'stockist_cod_commissions'
  ];

  for (const table of tables) {
    await query(`DELETE FROM ${table}`);
  }

  const dbInterface = { query, getTable, insertRow, updateRow, deleteRow };
  const seedMode = process.env.SEED_MODE || 'production';
  if (seedMode === 'test') {
    await seedRunner.seedDatabase(dbInterface);
    await backfillReferralCodes(dbInterface);
    await dedupeStockists(dbInterface);
    await normalizeClosingTimes(dbInterface);
  }
}

async function close() {
  if (pool && pool.end) {
    await pool.end();
  }
  pool = null;
}

async function getTable(tableName, client = null) {
  const res = await query(`SELECT * FROM ${tableName}`, [], client);
  return res.rows.map(normalizeRow);
}

async function saveTable(tableName, rows) {
  if (tableName === 'points_ledger') {
    throw new Error('points_ledger is append-only');
  }
  await query(`DELETE FROM ${tableName}`);
  const dbInterface = { query, getTable, insertRow, updateRow, deleteRow };
  for (const row of rows) {
    await insertRow(tableName, row);
  }
}

const jsonbCols = ['before', 'after', 'before_state', 'after_state', 'rules_fired', 'metric_values', 'details', 'active_regions', 'service_types', 'items'];

async function insertRow(tableName, row, client = null) {
  if (tableName === 'users' && !row.referral_code) {
    const existingUsers = await getTable('users', client);
    const existingCodes = new Set(existingUsers.map(u => u.referral_code).filter(Boolean));
    let code = generateRandomReferralCode();
    while (existingCodes.has(code)) {
      code = generateRandomReferralCode();
    }
    row.referral_code = code;
  }

  if (['stockists', 'partners', 'vendors'].includes(tableName) && row.phone !== undefined) {
    if (row.contact_phone === undefined) row.contact_phone = row.phone;
    delete row.phone;
  }
  if (tableName === 'stockists') {
    delete row.updated_at;
  }

  const keys = Object.keys(row);
  if (keys.length === 0) throw new Error('Cannot insert empty row');

  const cols = keys.map(k => `"${k}"`).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map(k => {
    const val = row[k];
    if (val !== null && val !== undefined && jsonbCols.includes(k)) {
      return JSON.stringify(val);
    }
    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      return JSON.stringify(val);
    }
    return val;
  });

  const sql = `INSERT INTO ${tableName} (${cols}) VALUES (${placeholders}) RETURNING *`;
  const res = await query(sql, values, client);
  return normalizeRow(res.rows[0]);
}

async function updateRow(tableName, id, patch, client = null) {
  if (tableName === 'points_ledger') {
    throw new Error('points_ledger is append-only');
  }
  if (['stockists', 'partners', 'vendors'].includes(tableName) && patch.phone !== undefined) {
    if (patch.contact_phone === undefined) patch.contact_phone = patch.phone;
    delete patch.phone;
  }
  if (tableName === 'stockists') {
    delete patch.updated_at;
  }

  const keys = Object.keys(patch).filter(k => k !== 'id');
  if (keys.length === 0) {
    const existing = await query(`SELECT * FROM ${tableName} WHERE id = $1`, [id], client);
    return normalizeRow(existing.rows[0]);
  }

  const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
  const values = keys.map(k => {
    const val = patch[k];
    if (val !== null && val !== undefined && jsonbCols.includes(k)) {
      return JSON.stringify(val);
    }
    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      return JSON.stringify(val);
    }
    return val;
  });
  values.push(id);

  const sql = `UPDATE ${tableName} SET ${setClauses} WHERE id = $${values.length} RETURNING *`;
  const res = await query(sql, values, client);
  return normalizeRow(res.rows[0]);
}

async function deleteRow(tableName, id, client = null) {
  if (tableName === 'points_ledger') {
    throw new Error('points_ledger is append-only');
  }

  const res = await query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [id], client);
  return normalizeRow(res.rows[0]);
}

async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tx = {
      query: (sql, params) => query(sql, params, client),
      getTable: (tableName) => getTable(tableName, client),
      insertRow: (tableName, row) => insertRow(tableName, row, client),
      updateRow: (tableName, id, patch) => updateRow(tableName, id, patch, client),
      deleteRow: (tableName, id) => deleteRow(tableName, id, client)
    };
    const res = await fn(tx);
    await client.query('COMMIT');
    return res;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getAll() {
  const tables = [
    'users', 'regions', 'stockists', 'products', 'orders', 'points_ledger',
    'inventory', 'vendors', 'partner_leads', 'fraud_reports', 'admin_audit_log',
    'commission_config', 'product_bill_photos', 'partners', 'partner_regions',
    'partner_packages', 'partner_users', 'customer_partner_bindings',
    'redemption_approvals', 'partner_feedback', 'partner_notifications',
    'user_blacklist', 'support_tickets', 'stockist_cod_commissions'
  ];

  const db = {};
  for (const table of tables) {
    db[table] = await getTable(table);
  }
  return db;
}

module.exports = {
  init,
  resetForTest,
  close,
  query,
  getTable,
  saveTable,
  insertRow,
  updateRow,
  deleteRow,
  transaction,
  getAll
};
