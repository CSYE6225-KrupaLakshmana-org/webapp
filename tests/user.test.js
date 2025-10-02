import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { basic, createUser } from './helpers/auth.js';

beforeEach(resetDb);

test('POST /v1/user -> 201 & user JSON (email username)', async () => {
  const body = {
    first_name: 'Jane',
    last_name: 'Doe',
    username: `jane_${Date.now()}@example.com`,
    password: 'somepassword'
  };
  const r = await request(app).post('/v1/user').send(body);
  expect(r.status).toBe(201);
  expect(r.body).toHaveProperty('id');
  expect(r.body).toMatchObject({
    first_name: 'Jane',
    last_name: 'Doe',
    username: body.username
  });
  // never leak password fields
  expect(r.body).not.toHaveProperty('password_hash');
});

test('GET /v1/user/{id} (Basic auth, self) -> 200', async () => {
  const { userId, username, password } = await createUser({ username: `self_${Date.now()}@example.com` });
  const r = await request(app)
    .get(`/v1/user/${userId}`)
    .set('Authorization', basic(username, password));
  expect(r.status).toBe(200);
  expect(r.body).toHaveProperty('id', userId);
  expect(r.body).toHaveProperty('username', username);
});

test('PUT /v1/user/{id} (Basic auth, self) -> 204', async () => {
  const { userId, username, password } = await createUser({ username: `put_${Date.now()}@example.com` });
  const r = await request(app)
    .put(`/v1/user/${userId}`)
    .set('Authorization', basic(username, password))
    .send({ first_name: 'JaneUpdated' });
  expect(r.status).toBe(204);

  // Optional: verify change
  const g = await request(app)
    .get(`/v1/user/${userId}`)
    .set('Authorization', basic(username, password));
  expect(g.status).toBe(200);
  expect(g.body.first_name).toBe('JaneUpdated');
});
