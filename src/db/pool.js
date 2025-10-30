// src/db/pool.js
import pg from 'pg';
import { statsd } from '../metrics.js';

const { Pool } = pg;

// Build from env – works in CI and locally
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optional SSL toggle for hosted DBs; off by default for local Postgres
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  max: Number(process.env.PG_MAX || 10),
  idleTimeoutMillis: Number(process.env.PG_IDLE || 10000),
});

// Wrap query to emit a timing metric (assignment requirement)
const _query = pool.query.bind(pool);
pool.query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await _query(text, params);
    statsd.timing('db.query.ms', Date.now() - start);
    return res;
  } catch (err) {
    statsd.timing('db.query.ms', Date.now() - start);
    throw err;
  }
};

// Helpful close() for tests if you need it
export async function closePool() {
  await pool.end();
}

// Export BOTH ways to satisfy all import styles
export { pool };
export default pool;
