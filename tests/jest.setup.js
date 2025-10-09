import { pool } from '../src/db/pool.js';

// Close the shared PG pool once after *all* tests complete.
afterAll(async () => {
  try { await pool.end(); } catch (_) {}
});
