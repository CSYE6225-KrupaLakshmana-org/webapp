import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { basic, createUser } from './helpers/auth.js';
import { v4 as uuidv4 } from 'uuid';

beforeEach(resetDb);

test('missing user fields -> 400', async () => {
  const r = await request(app).post('/v1/user').send({ first_name: 'x' });
  expect(r.status).toBe(400);
});

test('duplicate username (email) -> 409', async () => {
  const email = `dup_${Date.now()}@example.com`;
  const a = await request(app).post('/v1/user').send({
    first_name: 'A',
    last_name: 'B',
    username: email,
    password: 'P@ssw0rd!'
  });
  expect(a.status).toBe(201);

  const b = await request(app).post('/v1/user').send({
    first_name: 'C',
    last_name: 'D',
    username: email,
    password: 'P@ssw0rd!'
  });
  expect(b.status).toBe(409);
});

test('wrong Basic creds -> 401', async () => {
  const { userId, username } = await createUser({ username: `nope_${Date.now()}@example.com` });
  const r = await request(app)
    .get(`/v1/user/${userId}`)
    .set('Authorization', basic(username, 'wrongpassword'));
  expect(r.status).toBe(401);
});

test('protected without token -> 401', async () => {
  const { userId } = await createUser({ username: `naked_${Date.now()}@example.com` });
  const r = await request(app).get(`/v1/user/${userId}`);
  expect(r.status).toBe(401);
});

test('forbidden (other user) -> 403', async () => {
  const a = await createUser({ username: `a_${Date.now()}@example.com` });
  const b = await createUser({ username: `b_${Date.now()}@example.com` });

  // user A tries to access user B
  const r = await request(app)
    .get(`/v1/user/${b.userId}`)
    .set('Authorization', basic(a.username, a.password));
  expect(r.status).toBe(403);
});

test('get non-existent product -> 404', async () => {
  const r = await request(app).get(`/v1/product/${uuidv4()}`);
  expect(r.status).toBe(404);
});

test('wrong content-type -> 415', async () => {
  const { username, password } = await createUser({ username: `ct_${Date.now()}@example.com` });
  const r = await request(app)
    .post('/v1/product')
    .set('Authorization', basic(username, password))
    .set('Content-Type', 'text/plain')
    .send('not json');
  expect(r.status).toBe(415);
});

test('invalid product fields -> 400 (negative quantity)', async () => {
  const { username, password } = await createUser({ username: `neg_${Date.now()}@example.com` });
  const r = await request(app)
    .post('/v1/product')
    .set('Authorization', basic(username, password))
    .send({
      name: 'Bad',
      description: 'Negative qty',
      sku: 'BAD-1',
      manufacturer: 'Acme',
      quantity: -1
    });
  expect(r.status).toBe(400);
});
