import request from 'supertest';
import app from '../../src/app.js';

export async function createUserAndLogin(overrides = {}) {
  const base = { first_name:'Test', last_name:'User', username:`test_${Date.now()}`, password:'P@ssw0rd!', ...overrides };
  const u = await request(app).post('/v1/user').send(base);
  const id = u.body.id;
  const l = await request(app).post('/v1/login').send({ username: base.username, password: base.password });
  return { userId: id, token: l.body.token };
}
