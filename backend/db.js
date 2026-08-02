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

    // Check if DB has users
    const checkRes = await query('SELECT COUNT(*) as count FROM users');
    const count = parseInt(checkRes.rows[0].count, 10);
    if (count === 0) {
      await seedRunner.seedDatabase(dbInterface);
    }
    await backfillReferralCodes(dbInterface);
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
    'partner_notifications', 'feedback_reports'
  ];

  for (const table of tables) {
    await query(`DELETE FROM ${table}`);
  }

  const dbInterface = { query, getTable, insertRow, updateRow, deleteRow };
  await seedRunner.seedDatabase(dbInterface);
  await backfillReferralCodes(dbInterface);
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
    'redemption_approvals', 'partner_feedback', 'partner_notifications'
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
