// src/db/pool.js
import pkg from 'pg';
import { statsd } from '../metrics.js';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const origQuery = pool.query.bind(pool);
pool.query = async function (...args) {
  const start = Date.now();
  try {
    const result = await origQuery(...args);
    const ms = Date.now() - start;
    const firstWord = (args[0] && args[0].text ? args[0].text : args[0] || '')
      .toString().trim().split(/\s+/)[0].toUpperCase() || 'QUERY';
    statsd.timing(`db.${firstWord}.duration_ms`, ms);
    statsd.increment(`db.${firstWord}.count`);
    return result;
  } catch (e) {
    const ms = Date.now() - start;
    statsd.timing(`db.ERROR.duration_ms`, ms);
    statsd.increment(`db.ERROR.count`);
    throw e;
  }
};

export default pool;
