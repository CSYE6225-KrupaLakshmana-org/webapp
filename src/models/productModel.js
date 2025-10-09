import { pool } from '../db/pool.js';


export async function createProduct({ name, description, sku, manufacturer, quantity, owner_user_id }) {
const text = `INSERT INTO products (name, description, sku, manufacturer, quantity, owner_user_id)
VALUES ($1,$2,$3,$4,$5,$6)
RETURNING *`;
const { rows } = await pool.query(text, [name, description, sku, manufacturer, quantity, owner_user_id]);
return rows[0];
}


export async function getProductById(id) {
const { rows } = await pool.query('SELECT * FROM products WHERE id=$1', [id]);
return rows[0] || null;
}


export async function replaceProduct(id, { name, description, sku, manufacturer, quantity }) {
const text = `UPDATE products
SET name=$1, description=$2, sku=$3, manufacturer=$4, quantity=$5, date_last_updated=now()
WHERE id=$6
RETURNING *`;
const { rows } = await pool.query(text, [name, description, sku, manufacturer, quantity, id]);
return rows[0] || null;
}
export async function patchProduct(id, patch) {
    const sets = [];
    const vals = [];
    let i = 1;
    for (const [k, v] of Object.entries(patch)) {
    sets.push(`${k}=$${i++}`);
    vals.push(v);
    }
    sets.push(`date_last_updated=now()`);
    const text = `UPDATE products SET ${sets.join(', ')} WHERE id=$${i} RETURNING *`;
    vals.push(id);
    const { rows } = await pool.query(text, vals);
    return rows[0] || null;
    }
    
    
    export async function deleteProduct(id) {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id=$1', [id]);
    return rowCount > 0;
    }