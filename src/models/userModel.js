// src/models/userModel.js
import { pool } from '../db/pool.js';

/**
 * Create a user and return the public projection (no password_hash)
 */
export async function createUser({ first_name, last_name, username, password_hash }) {
  const q = `
    INSERT INTO users (first_name, last_name, username, password_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING id, first_name, last_name, username, account_created, account_updated
  `;
  const { rows } = await pool.query(q, [first_name, last_name, username, password_hash]);
  return rows[0];
}

/**
 * Fetch full row (including password_hash) by username — used for login
 */
export async function getUserByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
  return rows[0] || null;
}

/**
 * Public-safe fetch by id (NO password_hash)
 */
export async function getUserPublicById(id) {
  const q = `
    SELECT id, first_name, last_name, username, account_created, account_updated
    FROM users
    WHERE id = $1
  `;
  const { rows } = await pool.query(q, [id]);
  return rows[0] || null;
}

/**
 * Update mutable fields; does NOT return the row.
 * Controllers should call getUserPublicById if they need the updated copy.
 */
export async function updateUser(id, { first_name, last_name, password_hash } = {}) {
  const sets = [];
  const vals = [];
  let i = 1;

  if (first_name !== undefined) { sets.push(`first_name=$${i++}`); vals.push(first_name); }
  if (last_name  !== undefined) { sets.push(`last_name=$${i++}`);  vals.push(last_name); }
  if (password_hash !== undefined) { sets.push(`password_hash=$${i++}`); vals.push(password_hash); }

  // Always bump account_updated
  sets.push('account_updated=now()');

  const q = `UPDATE users SET ${sets.join(', ')} WHERE id=$${i}`;
  vals.push(id);

  const result = await pool.query(q, vals);
  return result.rowCount; // optional; controllers are returning 204
}
