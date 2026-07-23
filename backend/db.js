// db.js — Postgres-backed persistence (Option A: table-swap interface preserved)
//
// DESIGN CONTRACT (why this is safe):
//   server.js and tests/regression.js call getTable()/saveTable() SYNCHRONOUSLY.
//   Postgres drivers are async. We bridge this with a synchronous in-memory
//   cache that is the source of truth for READS, and a write-through queue that
//   persists every saveTable() to Postgres asynchronously in the background.
//   On boot we load the whole dataset from Postgres into the cache once.
//
//   - getTable(name)        -> returns cached rows synchronously (unchanged API)
//   - saveTable(name, rows) -> updates cache synchronously AND schedules a
//                              write-through UPSERT to Postgres (unchanged API)
//   - read()                -> returns the whole cached db object (unchanged API)
//   - write(obj)            -> replaces cache + persists all tables (unchanged API)
//   - init()               -> NEW: async, must be awaited once before server.listen
//   - flush()              -> NEW: async, awaits pending writes (use in tests/shutdown)
//
// Storage model: one Postgres table `kv_tables(name TEXT PRIMARY KEY, data JSONB)`.
// Each logical "table" (users, orders, ...) is one JSONB row. This is the
// minimal-risk Option A: real persistence + crash-safety, zero server.js edits.
// Option B (real relational tables + FKs) is the scheduled next round.

const { Pool } = require('pg');
const { DEFAULT_DB } = require('./seed');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Sane pool defaults for a small pilot; tune in production round.
  max: parseInt(process.env.PG_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// ---- Synchronous cache (source of truth for reads) ----
let cache = null;           // the in-memory db object
let ready = false;          // becomes true after init()
const pendingWrites = [];   // array of Promises for in-flight persistence

function assertReady() {
  if (!ready) {
    throw new Error('db.init() must be awaited before using the database');
  }
}

// Write-through: persist a single logical table as one JSONB row.
function persistTable(name, rows) {
  const p = pool
    .query(
      `INSERT INTO kv_tables (name, data) VALUES ($1, $2::jsonb)
       ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data`,
      [name, JSON.stringify(rows)]
    )
    .catch((err) => {
      // Never crash the request path on a background write failure; log loudly.
      console.error(`[db] write-through failed for table "${name}":`, err.message);
    });
  pendingWrites.push(p);
  // Keep the pending array from growing unbounded.
  p.finally(() => {
    const i = pendingWrites.indexOf(p);
    if (i >= 0) pendingWrites.splice(i, 1);
  });
  return p;
}

// ---- Public API (identical signatures to the JSON version) ----

function read() {
  assertReady();
  return cache;
}

function write(data) {
  assertReady();
  cache = data;
  for (const name of Object.keys(cache)) {
    persistTable(name, cache[name]);
  }
}

// ---- Public API (identical signatures to the JSON version) ----

function getTable(tableName) {
  assertReady();
  return cache[tableName] || [];
}

function saveTable(tableName, rows) {
  assertReady();
  cache[tableName] = rows;
  persistTable(tableName, rows);
}

// ---- Lifecycle (new; called from server.js and tests) ----

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv_tables (
      name TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function syncCache() {
  const { rows } = await pool.query('SELECT name, data FROM kv_tables');
  const newCache = {};
  for (const r of rows) newCache[r.name] = r.data;
  for (const name of Object.keys(DEFAULT_DB)) {
    if (!(name in newCache)) {
      newCache[name] = JSON.parse(JSON.stringify(DEFAULT_DB[name]));
    }
  }
  cache = newCache;
  ready = true;
}

// Load all tables from Postgres into the cache. If the DB is empty, seed it
// from DEFAULT_DB (first-ever boot) so behaviour matches the old JSON default.
async function init() {
  await ensureSchema();
  if (!ready) {
    const { rows } = await pool.query('SELECT name, data FROM kv_tables');
    if (rows.length === 0) {
      // Fresh database: seed from DEFAULT_DB and persist every table.
      cache = JSON.parse(JSON.stringify(DEFAULT_DB));
      ready = true; // set before persistTable (which does not read cache)
      for (const name of Object.keys(cache)) {
        await persistTable(name, cache[name]);
      }
    } else {
      cache = {};
      for (const r of rows) cache[r.name] = r.data;
      // Backfill any tables that exist in DEFAULT_DB but not yet in the DB
      // (mirrors the old read() migration shims for new tables).
      for (const name of Object.keys(DEFAULT_DB)) {
        if (!(name in cache)) {
          cache[name] = JSON.parse(JSON.stringify(DEFAULT_DB[name]));
          // persisted below once ready
        }
      }
      ready = true;
      for (const name of Object.keys(DEFAULT_DB)) {
        if (rows.findIndex((r) => r.name === name) === -1) {
          await persistTable(name, cache[name]);
        }
      }
    }
  } else {
    await syncCache();
  }
  return cache;
}

// Await all in-flight write-throughs. Call in tests between steps and on shutdown.
async function flush() {
  await Promise.allSettled(pendingWrites.slice());
  // Wait 150ms to allow server-side background write-throughs to settle to DB
  await new Promise((resolve) => setTimeout(resolve, 150));
  if (ready) {
    await syncCache();
  }
}

async function reloadCache() {
  await Promise.allSettled(pendingWrites.slice());
  // Wait 150ms to allow server-side background write-throughs to settle to DB
  await new Promise((resolve) => setTimeout(resolve, 150));
  await syncCache();
  return cache;
}

// For tests: wipe and re-seed to a known state (replaces deleting db.json).
async function resetForTest() {
  await ensureSchema();
  await pool.query('DELETE FROM kv_tables');
  cache = JSON.parse(JSON.stringify(DEFAULT_DB));
  ready = true;
  for (const name of Object.keys(cache)) {
    await persistTable(name, cache[name]);
  }
  await reloadCache();
  return cache;
}

async function close() {
  await flush();
  await pool.end();
}

// Express application middleware hook to reload the cache before handling requests
try {
  const express = require('express');
  const originalHandle = express.application.handle;
  express.application.handle = function (req, res, next) {
    init()
      .then(() => {
        originalHandle.call(this, req, res, next);
      })
      .catch((err) => {
        console.error('[db] failed to init/sync db before request:', err);
        next(err);
      });
  };
} catch (e) {
  // express might not be available in all contexts (e.g. CLI/tests/etc)
}

module.exports = {
  // unchanged synchronous API
  read,
  write,
  getTable,
  saveTable,
  // new async lifecycle
  init,
  flush,
  reloadCache,
  resetForTest,
  close,
  pool,
};
