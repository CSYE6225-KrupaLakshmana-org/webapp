import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireJson } from '../middleware/requireJson.js';
import {
  createUserHandler, loginHandler, getUserHandler, putUserHandler
} from '../controllers/userController.js';
import {
  publicGetProduct, createProductHandler, putProductHandler, patchProductHandler, deleteProductHandler
} from '../controllers/productController.js';

const r = Router();

// PUBLIC
r.get('/healthz', (req, res) => res.status(200).send());
r.post('/v1/user', requireJson, createUserHandler);
r.post('/v1/login', requireJson, loginHandler);  // utility for tests
r.get('/v1/product/:productId', publicGetProduct);

// AUTHENTICATED
r.get('/v1/user/:userId', requireAuth, getUserHandler);
r.put('/v1/user/:userId', requireJson, requireAuth, putUserHandler);

r.post('/v1/product', requireJson, requireAuth, createProductHandler);
r.put('/v1/product/:productId', requireJson, requireAuth, putProductHandler);
r.patch('/v1/product/:productId', requireJson, requireAuth,  patchProductHandler);
r.delete('/v1/product/:productId', requireAuth, deleteProductHandler);

export default r;
