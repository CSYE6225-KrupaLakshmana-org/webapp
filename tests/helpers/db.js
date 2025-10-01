import { pool } from '../../src/db/pool.js';

export async function resetDb() {
  await pool.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE;');
  await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
}
