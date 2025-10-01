import request from 'supertest';
import app from '..//src/app.js';
import { resetDb} from './helpers/db.js';
import { createUserAndLogin } from './helpers/auth.js';

beforeEach(resetDb);

test('POST /v1/user -> 201 & user JSON', async () => {
  const r = await request(app).post('/v1/user').send({ first_name:'Jane', last_name:'Doe', username:'jane01', password:'somepassword' });
  expect(r.status).toBe(201);
  expect(r.body).toHaveProperty('id');
});

test('GET /v1/user/{id} (auth) -> 200', async () => {
  const { userId, token } = await createUserAndLogin({ username:'auth01' });
  const r = await request(app).get(`/v1/user/${userId}`).set('Authorization', `Bearer ${token}`);
  expect(r.status).toBe(200);
});

test('PUT /v1/user/{id} (auth) -> 204', async () => {
  const { userId, token } = await createUserAndLogin({ username:'put01' });
  const r = await request(app).put(`/v1/user/${userId}`).set('Authorization', `Bearer ${token}`).send({ first_name:'JaneUpdated' });
  expect(r.status).toBe(204);
});
