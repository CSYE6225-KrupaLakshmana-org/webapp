import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  createUser,
  getUserByUsername,
  getUserPublicById,   // make sure your model exposes the "public" projection (no password_hash)
  updateUser,
} from '../models/userModel.js';
import { validateNewUser, validateUserUpdate } from '../utils/validate.js';

const SALT_ROUNDS = 10;

/**
 * POST /v1/user (public)
 * 201 Created + user JSON (no password fields)
 * 400 Bad Request
 * 409 Conflict (duplicate username)
 */
export async function createUserHandler(req, res) {
  try {
    const err = validateNewUser(req.body);
    if (err) return res.status(400).json({ error: err });

    const { first_name, last_name, username, password } = req.body;

    const existing = await getUserByUsername(username);
    if (existing) return res.status(409).json({ error: 'username already exists' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser({ first_name, last_name, username, password_hash });
    return res.status(201).json(user);
  } catch (e) {
    // Unique violation safety net (Postgres)
    if (e && e.code === '23505') {
      return res.status(409).json({ error: 'username already exists' });
    }
    console.error('createUserHandler error:', e);
    return res.status(500).json({ error: 'internal error' });
  }
}

/**
 * POST /v1/login (public utility)
 * 200 OK + { token }
 * 400 Bad Request if missing creds
 * 401 Unauthorized if invalid creds
 */
export async function loginHandler(req, res) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }
    const u = await getUserByUsername(username);
    if (!u) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign(
      { sub: u.id, username: u.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({ token });
  } catch (e) {
    console.error('loginHandler error:', e);
    return res.status(500).json({ error: 'internal error' });
  }
}

/**
 * GET /v1/user/:userId (auth)
 * 200 OK + user JSON
 * 401 via middleware
 * 403 Forbidden if requesting other user
 * 404 Not Found
 */
export async function getUserHandler(req, res) {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId) return res.status(403).json({ error: 'forbidden' });

    const u = await getUserPublicById(userId);
    if (!u) return res.status(404).json({ error: 'not found' });

    return res.json(u);
  } catch (e) {
    console.error('getUserHandler error:', e);
    return res.status(500).json({ error: 'internal error' });
  }
}

/**
 * PUT /v1/user/:userId (auth)
 * 204 No Content (Swagger requires 204)
 * 400 Bad Request (invalid fields)
 * 401 via middleware
 * 403 Forbidden (not self)
 * 404 Not Found
 */
export async function putUserHandler(req, res) {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId) return res.status(403).json({ error: 'forbidden' });

    const err = validateUserUpdate(req.body);
    if (err) return res.status(400).json({ error: err });

    // Ensure user exists first (so we can return 404)
    const exists = await getUserPublicById(userId);
    if (!exists) return res.status(404).json({ error: 'not found' });

    const patch = {};
    if (req.body.first_name !== undefined) patch.first_name = req.body.first_name;
    if (req.body.last_name  !== undefined) patch.last_name  = req.body.last_name;
    if (req.body.password   !== undefined) {
      patch.password_hash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    }

    await updateUser(userId, patch);
    return res.status(204).send(); // No body per Swagger
  } catch (e) {
    console.error('putUserHandler error:', e);
    return res.status(500).json({ error: 'internal error' });
  }
}
