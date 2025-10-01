import {
    validateNewProduct,
    validateProductUpdate,
  } from '../utils/validate.js';
  
  import {
    createProduct,
    getProductById,
    replaceProduct,
    patchProduct,
    deleteProduct,
  } from '../models/productModel.js';
  
  /**
   * GET /v1/product/:productId (public)
   * 200 OK + product JSON
   * 404 Not Found
   */
  export async function publicGetProduct(req, res) {
    try {
      const p = await getProductById(req.params.productId);
      if (!p) return res.status(404).json({ error: 'not found' });
      return res.json(p);
    } catch (e) {
      console.error('publicGetProduct error:', e);
      return res.status(500).json({ error: 'internal error' });
    }
  }
  
  /**
   * POST /v1/product (auth)
   * 201 Created + product JSON
   * 400 Bad Request
   * 401 via middleware
   * 409 Conflict (duplicate sku for same owner)
   */
  export async function createProductHandler(req, res) {
    try {
      const err = validateNewProduct(req.body);
      if (err) return res.status(400).json({ error: err });
  
      const p = await createProduct({ ...req.body, owner_user_id: req.user.id });
      return res.status(201).json(p);
    } catch (e) {
      if (e && e.code === '23505') {
        return res.status(409).json({ error: 'duplicate sku for owner' });
      }
      console.error('createProductHandler error:', e);
      return res.status(500).json({ error: 'internal error' });
    }
  }
  
  /**
   * PUT /v1/product/:productId (auth)
   * 204 No Content
   * 400 Bad Request
   * 401 via middleware
   * 403 Forbidden (not owner)
   * 404 Not Found
   * 409 Conflict (duplicate sku for owner)
   */
  export async function putProductHandler(req, res) {
    try {
      const err = validateNewProduct(req.body);
      if (err) return res.status(400).json({ error: err });
  
      const existing = await getProductById(req.params.productId);
      if (!existing) return res.status(404).json({ error: 'not found' });
      if (existing.owner_user_id !== req.user.id) {
        return res.status(403).json({ error: 'forbidden' });
      }
  
      await replaceProduct(existing.id, req.body);
      return res.status(204).send(); // No body per Swagger
    } catch (e) {
      if (e && e.code === '23505') {
        return res.status(409).json({ error: 'duplicate sku for owner' });
      }
      console.error('putProductHandler error:', e);
      return res.status(500).json({ error: 'internal error' });
    }
  }
  
  /**
   * PATCH /v1/product/:productId (auth)
   * 204 No Content
   * 400 Bad Request
   * 401 via middleware
   * 403 Forbidden (not owner)
   * 404 Not Found
   * 409 Conflict (duplicate sku for owner)
   */
  export async function patchProductHandler(req, res) {
    try {
      const err = validateProductUpdate(req.body);
      if (err) return res.status(400).json({ error: err });
  
      const existing = await getProductById(req.params.productId);
      if (!existing) return res.status(404).json({ error: 'not found' });
      if (existing.owner_user_id !== req.user.id) {
        return res.status(403).json({ error: 'forbidden' });
      }
  
      // Only allow patch of permitted keys
      const allowed = (({ name, description, sku, manufacturer, quantity }) => ({
        name, description, sku, manufacturer, quantity
      }))(req.body);
  
      const patch = Object.fromEntries(
        Object.entries(allowed).filter(([, v]) => v !== undefined)
      );
      if (Object.keys(patch).length === 0) {
        return res.status(400).json({ error: 'no updatable fields' });
      }
  
      await patchProduct(existing.id, patch);
      return res.status(204).send(); // No body per Swagger
    } catch (e) {
      if (e && e.code === '23505') {
        return res.status(409).json({ error: 'duplicate sku for owner' });
      }
      console.error('patchProductHandler error:', e);
      return res.status(500).json({ error: 'internal error' });
    }
  }
  
  /**
   * DELETE /v1/product/:productId (auth)
   * 204 No Content
   * 401 via middleware
   * 403 Forbidden (not owner)
   * 404 Not Found
   */
  export async function deleteProductHandler(req, res) {
    try {
      const existing = await getProductById(req.params.productId);
      if (!existing) return res.status(404).json({ error: 'not found' });
      if (existing.owner_user_id !== req.user.id) {
        return res.status(403).json({ error: 'forbidden' });
      }
  
      await deleteProduct(existing.id);
      return res.status(204).send();
    } catch (e) {
      console.error('deleteProductHandler error:', e);
      return res.status(500).json({ error: 'internal error' });
    }
  }
  