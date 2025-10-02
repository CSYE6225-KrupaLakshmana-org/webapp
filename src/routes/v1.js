// src/routes/v1.js
import { Router } from 'express';
import { requireBasicAuth } from '../middleware/auth.js';
import { requireJson } from '../middleware/requireJson.js';

import {
  createUserHandler,
  getUserHandler,
  putUserHandler,
} from '../controllers/userController.js';

import {
  publicGetProduct,
  createProductHandler,
  putProductHandler,
  patchProductHandler,
  deleteProductHandler,
} from '../controllers/productController.js';

const r = Router();

// PUBLIC
r.get('/healthz', (req, res) => res.status(200).send());
r.post('/v1/user', requireJson, createUserHandler);
r.get('/v1/product/:productId', publicGetProduct);

// AUTHENTICATED (Basic Auth)
// NOTE: requireJson must come BEFORE auth for write ops to produce 415 first.
r.get('/v1/user/:userId', requireBasicAuth, getUserHandler);
r.put('/v1/user/:userId', requireJson, requireBasicAuth, putUserHandler);

r.post('/v1/product', requireJson, requireBasicAuth, createProductHandler);
r.put('/v1/product/:productId', requireJson, requireBasicAuth, putProductHandler);
r.patch('/v1/product/:productId', requireJson, requireBasicAuth, patchProductHandler);
r.delete('/v1/product/:productId', requireBasicAuth, deleteProductHandler);

export default r;
