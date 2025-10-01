import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { createUserAndLogin } from './helpers/auth.js';
import { v4 as uuidv4 } from 'uuid';

beforeEach(resetDb);


test('missing user fields -> 400', async () => {
  expect((await request(app).post('/v1/user').send({ first_name:'x' })).status).toBe(400);
});

test('duplicate username -> 409', async () => {
  await request(app).post('/v1/user').send({ first_name:'A', last_name:'B', username:'dup', password:'P@ssw0rd!' });
  expect((await request(app).post('/v1/user').send({ first_name:'C', last_name:'D', username:'dup', password:'P@ssw0rd!' })).status).toBe(409);
});

test('login wrong creds -> 401', async () => {
  await request(app).post('/v1/user').send({ first_name:'A', last_name:'B', username:'u1', password:'P@ssw0rd!' });
  expect((await request(app).post('/v1/login').send({ username:'u1', password:'bad' })).status).toBe(401);
});

test('protected without token -> 401', async () => {
  expect((await request(app).get(`/v1/user/${uuidv4()}`)).status).toBe(401);
});

test('get non-existent product -> 404', async () => {
  expect((await request(app).get(`/v1/product/${uuidv4()}`)).status).toBe(404);
});

test('wrong content-type -> 415', async () => {
  const { token } = await createUserAndLogin({ username:'ct' });
  const r = await request(app).post('/v1/product').set('Authorization', `Bearer ${token}`).set('Content-Type','text/plain').send('bad');
  expect(r.status).toBe(415);
});
