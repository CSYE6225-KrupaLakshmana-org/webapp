import request from 'supertest';
import app from '../src/app.js';
import { resetDb } from './helpers/db.js';
import { createUserAndLogin } from './helpers/auth.js';

beforeEach(resetDb);


test('POST product -> 201, then public GET -> 200', async () => {
  const { token } = await createUserAndLogin({ username:'p01' });
  const c = await request(app).post('/v1/product').set('Authorization', `Bearer ${token}`)
    .send({ name:'USB-C', description:'1m', sku:'CAB-1', manufacturer:'Acme', quantity:5 });
  expect(c.status).toBe(201);
  const g = await request(app).get(`/v1/product/${c.body.id}`);
  expect(g.status).toBe(200);
});

test('PUT -> 204, PATCH -> 204, DELETE -> 204', async () => {
  const { token } = await createUserAndLogin({ username:'p02' });
  const p = await request(app).post('/v1/product').set('Authorization', `Bearer ${token}`)
    .send({ name:'W', description:'v1', sku:'W-1', manufacturer:'Acme', quantity:1 });
  expect(p.status).toBe(201);

  expect((await request(app).put(`/v1/product/${p.body.id}`).set('Authorization', `Bearer ${token}`)
    .send({ name:'W', description:'v2', sku:'W-1', manufacturer:'Acme', quantity:3 })).status).toBe(204);

  expect((await request(app).patch(`/v1/product/${p.body.id}`).set('Authorization', `Bearer ${token}`)
    .send({ quantity: 4 })).status).toBe(204);

  expect((await request(app).delete(`/v1/product/${p.body.id}`).set('Authorization', `Bearer ${token}`)).status).toBe(204);
});
