// src/controllers/userController.js
import bcrypt from 'bcrypt';
import {
  createUser,
  getUserByUsername,
  getUserPublicById,
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

    const { first_name, last_name, username, password,hrelololololololo } = req.body;

    const existing = await getUserByUsername(username);
    if (existing) return res.status(409).json({ error: 'username already exists' });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser({ first_name, last_name, username, password_hash });
    return res.status(201).json(user);
  } catch (e) {
    if (e && e.code === '23505') {
      return res.status(409).json({ error: 'username already exists' });
    }
    console.error('createUserHandler error:', e);
    return res.status(500).json({ error: 'internal error' });
  }
}

/**
 * GET /v1/user/:userId (Basic auth)
 * 200 OK + user JSON
 * 403 Forbidden if not self
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
 * PUT /v1/user/:userId (Basic auth)
 * 204 No Content
 * 400 Bad Request
 * 403 Forbidden if not self
 * 404 Not Found
 */
export async function putUserHandler(req, res) {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId) return res.status(403).json({ error: 'forbidden' });

    const err = validateUserUpdate(req.body);
    if (err) return res.status(400).json({ error: err });

    // ensure user exists
    const exists = await getUserPublicById(userId);
    if (!exists) return res.status(404).json({ error: 'not found' });

    const patch = {};
    if (req.body.first_name !== undefined) patch.first_name = req.body.first_name;
    if (req.body.last_name  !== undefined) patch.last_name  = req.body.last_name;
    if (req.body.password   !== undefined) {
      patch.password_hash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    }

    await updateUser(userId, patch);
    return res.status(204).send();
  } catch (e) {
    console.error('putUserHandler error:', e);
    return res.status(500).json({ error: 'internal error' });
  }
}
