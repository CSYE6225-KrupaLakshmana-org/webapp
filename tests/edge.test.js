import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { createUserAndLogin } from './helpers/auth.js';

beforeEach(resetDb);

test('max 255-char strings -> 201', async () => {
  const { token } = await createUserAndLogin({ username:'edge01' });
  const long = 'x'.repeat(255);
  const r = await request(app).post('/v1/product').set('Authorization', `Bearer ${token}`)
    .send({ name: long, description: long, sku: 'SKU-EDGE', manufacturer: long, quantity: 0 });
  expect(r.status).toBe(201);
});
