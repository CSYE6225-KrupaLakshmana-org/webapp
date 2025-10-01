import { validateNewProduct, validateProductUpdate } from '../utils/validate.js';
import { createProduct, getProductById, replaceProduct, patchProduct, deleteProduct } from '../models/productModel.js';


export async function publicGetProduct(req, res) {
const p = await getProductById(req.params.productId);
if (!p) return res.status(404).json({ error: 'not found' });
return res.json(p);
}


export async function createProductHandler(req, res) {
const err = validateNewProduct(req.body);
if (err) return res.status(400).json({ error: err });
const p = await createProduct({ ...req.body, owner_user_id: req.user.id });
return res.status(201).json(p);
}


export async function putProductHandler(req, res) {
const err = validateNewProduct(req.body);
if (err) return res.status(400).json({ error: err });
const existing = await getProductById(req.params.productId);
if (!existing) return res.status(404).json({ error: 'not found' });
if (existing.owner_user_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
const replaced = await replaceProduct(existing.id, req.body);
return res.json(replaced);
}
export async function patchProductHandler(req, res) {
    const err = validateProductUpdate(req.body);
    if (err) return res.status(400).json({ error: err });
    const existing = await getProductById(req.params.productId);
    if (!existing) return res.status(404).json({ error: 'not found' });
    if (existing.owner_user_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    const allowed = (({ name, description, sku, manufacturer, quantity }) => ({ name, description, sku, manufacturer, quantity }))(req.body);
    const filtered = Object.fromEntries(Object.entries(allowed).filter(([,v]) => v !== undefined));
    if (Object.keys(filtered).length === 0) return res.status(400).json({ error: 'no updatable fields' });
    const patched = await patchProduct(existing.id, filtered);
    return res.json(patched);
    }
    
    
    export async function deleteProductHandler(req, res) {
    const existing = await getProductById(req.params.productId);
    if (!existing) return res.status(404).json({ error: 'not found' });
    if (existing.owner_user_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    await deleteProduct(existing.id);
    return res.status(204).send();
    }
    