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


// healthz (public)
r.get('/healthz', (req, res) => res.status(200).send());


// unauth (public)
r.post('/v1/user', requireJson, createUserHandler);
r.post('/v1/login', requireJson, loginHandler); // utility login to get JWT
r.get('/v1/product/:productId', publicGetProduct);


// auth required
r.get('/v1/user/:userId', requireAuth, getUserHandler);
r.put('/v1/user/:userId', requireAuth, requireJson, putUserHandler);
r.post('/v1/product', requireAuth, requireJson, createProductHandler);
r.put('/v1/product/:productId', requireAuth, requireJson, putProductHandler);
r.patch('/v1/product/:productId', requireAuth, requireJson, patchProductHandler);
r.delete('/v1/product/:productId', requireAuth, deleteProductHandler);


export default r;
