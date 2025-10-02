// src/middleware/auth.js
import bcrypt from 'bcrypt';
import { getUserByUsername } from '../models/userModel.js';

/**
 * Basic Authentication middleware (no sessions, no JWT).
 * Expects: Authorization: Basic base64(username:password)
 * On success -> sets req.user = { id, username }
 */
export async function requireBasicAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');
    if (scheme !== 'Basic' || !encoded) {
      return res
        .status(401)
        .set('WWW-Authenticate', 'Basic realm="user", charset="UTF-8"')
        .json({ error: 'Unauthorized' });
    }

    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    if (sep === -1) {
      return res.status(401).json({ error: 'Invalid Basic credentials' });
    }

    const username = decoded.slice(0, sep);
    const password = decoded.slice(sep + 1);

    const user = await getUserByUsername(username);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Unauthorized' });

    req.user = { id: user.id, username: user.username };
    next();
  } catch (e) {
    console.error('requireBasicAuth error:', e);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
