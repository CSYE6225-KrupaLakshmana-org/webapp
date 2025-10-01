import{ pool } from '../db/pool.js';


export async function createUser({ first_name, last_name, username, password_hash }) {
const text = `INSERT INTO users (first_name, last_name, username, password_hash)
VALUES ($1,$2,$3,$4)
RETURNING id, first_name, last_name, username, account_created, account_updated`;
const { rows } = await pool.query(text, [first_name, last_name, username, password_hash]);
return rows[0];
}


export async function getUserByUsername(username) {
const { rows } = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
return rows[0] || null;
}


export async function getUserById(id) {
const { rows } = await pool.query('SELECT id, first_name, last_name, username, account_created, account_updated FROM users WHERE id=$1', [id]);
return rows[0] || null;
}


export async function updateUser(id, { first_name, last_name, password_hash }) {
const sets = [];
const vals = [];
let i = 1;
if (first_name !== undefined) { sets.push(`first_name=$${i++}`); vals.push(first_name); }
if (last_name !== undefined) { sets.push(`last_name=$${i++}`); vals.push(last_name); }
if (password_hash !== undefined) { sets.push(`password_hash=$${i++}`); vals.push(password_hash); }
sets.push(`account_updated=now()`);
const text = `UPDATE users SET ${sets.join(', ')} WHERE id=$${i} RETURNING id, first_name, last_name, username, account_created, account_updated`;
vals.push(id);
const { rows } = await pool.query(text, vals);
return rows[0] || null;
}