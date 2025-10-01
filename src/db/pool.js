// src/db/pool.js
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load the right env file depending on environment
dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  // quiet: true, // uncomment to silence dotenv logs
});

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Optional: basic error logging
pool.on('error', (err) => {
  console.error('PG pool error:', err);
});
