import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { basic, createUser } from './helpers/auth.js';

beforeEach(resetDb);

test('POST product -> 201, then public GET -> 200', async () => {
  const { username, password } = await createUser({ username: `p_${Date.now()}@example.com` });

  const create = await request(app)
    .post('/v1/product')
    .set('Authorization', basic(username, password))
    .send({
      name: 'USB-C Cable',
      description: '1m',
      sku: 'CAB-001',
      manufacturer: 'Acme',
      quantity: 5
    });

  expect(create.status).toBe(201);
  const id = create.body.id;

  const get = await request(app).get(`/v1/product/${id}`);
  expect(get.status).toBe(200);
  expect(get.body).toHaveProperty('id', id);
  expect(get.body.quantity).toBe(5);
});

test('PUT -> 204, PATCH -> 204, DELETE -> 204', async () => {
  const { username, password } = await createUser({ username: `p2_${Date.now()}@example.com` });

  const created = await request(app)
    .post('/v1/product')
    .set('Authorization', basic(username, password))
    .send({
      name: 'Widget',
      description: 'v1',
      sku: 'W-1',
      manufacturer: 'Acme',
      quantity: 1
    });
  expect(created.status).toBe(201);
  const id = created.body.id;

  const put = await request(app)
    .put(`/v1/product/${id}`)
    .set('Authorization', basic(username, password))
    .send({
      name: 'Widget',
      description: 'v2',
      sku: 'W-1',
      manufacturer: 'Acme',
      quantity: 3
    });
  expect(put.status).toBe(204);

  const patch = await request(app)
    .patch(`/v1/product/${id}`)
    .set('Authorization', basic(username, password))
    .send({ quantity: 4 });
  expect(patch.status).toBe(204);

  const del = await request(app)
    .delete(`/v1/product/${id}`)
    .set('Authorization', basic(username, password));
  expect(del.status).toBe(204);

  const getAfter = await request(app).get(`/v1/product/${id}`);
  expect(getAfter.status).toBe(404);
});
