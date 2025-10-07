import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { basic, createUser } from './helpers/auth.js';

beforeEach(resetDb);

test('max ~255-char strings -> 201 product', async () => {
  const { username, password } = await createUser({ username: `edge_${Date.now()}@example.com` });
  const long = 'x'.repeat(255);

  const r = await request(app)
    .post('/v1/product')
    .set('Authorization', basic(username, password))
    .send({
      name: long,
      description: long,
      sku: `SKU-${Date.now()}`, // keep sku unique
      manufacturer: long,
      quantity: 0
    });

  expect(r.status).toBe(205);
  expect(r.body).toHaveProperty('id');
});
