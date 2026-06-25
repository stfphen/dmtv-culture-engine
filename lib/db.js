// Postgres connection (lazy). Returns null when DATABASE_URL is not set => MOCK mode.
let _pool = null;
let _triedInit = false;

export function dbEnabled() {
  return !!process.env.DATABASE_URL;
}

export function getPool() {
  if (!dbEnabled()) return null;
  if (_pool || _triedInit) return _pool;
  _triedInit = true;
  try {
    // dynamic require so the app still boots if `pg` isn't installed in mock mode
    const { Pool } = require("pg");
    _pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  } catch (e) {
    console.warn("[db] pg unavailable, falling back to mock store:", e.message);
    _pool = null;
  }
  return _pool;
}

export async function query(text, params) {
  const pool = getPool();
  if (!pool) throw new Error("DB not enabled");
  return pool.query(text, params);
}
