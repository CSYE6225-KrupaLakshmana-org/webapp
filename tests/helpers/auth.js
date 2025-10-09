// tests/helpers/auth.js
import request from 'supertest';
import app from '../../src/app.js';

export function basic(username, password) {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}

export async function createUser(overrides = {}) {
  const base = {
    first_name: 'Test',
    last_name: 'User',
    username: `test_${Date.now()}@example.com`,
    password: 'P@ssw0rd!',
    ...overrides,
  };
  const u = await request(app).post('/v1/user').send(base);
  return { userId: u.body.id, username: base.username, password: base.password };
}
