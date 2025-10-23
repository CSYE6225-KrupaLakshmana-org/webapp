import path from "path";
import crypto from "crypto";
import { uploadImageToS3, deleteImageFromS3 } from "../s3.js";
import pool from "../db/pool.js"; // adjust path if your pool export differs

export async function uploadImageHandler(req, res) {
  const { product_id } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ error: "file is required" });

  const prod = await pool.query("SELECT owner_user_id FROM products WHERE id=$1", [product_id]);
  if (prod.rowCount === 0) return res.status(404).end();
  if (prod.rows[0].owner_user_id !== req.user.id) return res.status(403).end();

  const okTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!okTypes.includes(file.mimetype)) return res.status(400).json({ error: "unsupported file type" });

  const safeName = path.basename(file.originalname).replace(/\s+/g, "_");
  const key = `${req.user.id}/${product_id}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  const ins = await pool.query(
    `INSERT INTO images(product_id, owner_id, file_name, s3_bucket_path)
     VALUES ($1,$2,$3,$4)
     RETURNING image_id, product_id, file_name, date_created, s3_bucket_path`,
    [product_id, req.user.id, file.originalname, key]
  );

  await uploadImageToS3({
    bucket: process.env.S3_BUCKET,
    key,
    buffer: file.buffer,
    contentType: file.mimetype,
    metadata: { owner: req.user.id, product: product_id, imageid: ins.rows[0].image_id }
  });

  res.status(201).json(ins.rows[0]);
}

export async function listImagesHandler(req, res) {
  const { product_id } = req.params;
  const prod = await pool.query("SELECT owner_user_id FROM products WHERE id=$1", [product_id]);
  if (prod.rowCount === 0) return res.status(404).end();
  if (prod.rows[0].owner_user_id !== req.user.id) return res.status(403).end();

  const r = await pool.query(
    `SELECT image_id, product_id, file_name, date_created, s3_bucket_path
     FROM images WHERE product_id=$1 ORDER BY date_created DESC`, [product_id]);
  res.json(r.rows);
}

export async function getImageHandler(req, res) {
  const { product_id, image_id } = req.params;
  const img = await pool.query("SELECT * FROM images WHERE image_id=$1 AND product_id=$2",
    [image_id, product_id]);
  if (img.rowCount === 0) return res.status(404).end();

  const prod = await pool.query("SELECT owner_user_id FROM products WHERE id=$1", [product_id]);
  if (prod.rowCount === 0) return res.status(404).end();
  if (prod.rows[0].owner_user_id !== req.user.id) return res.status(403).end();

  const { image_id: iid, product_id: pid, file_name, date_created, s3_bucket_path } = img.rows[0];
  res.json([{ image_id: iid, product_id: pid, file_name, date_created, s3_bucket_path }]);
}

export async function deleteImageHandler(req, res) {
  const { product_id, image_id } = req.params;
  const img = await pool.query("SELECT * FROM images WHERE image_id=$1 AND product_id=$2",
    [image_id, product_id]);
  if (img.rowCount === 0) return res.status(404).end();
  if (img.rows[0].owner_id !== req.user.id) return res.status(403).end();

  await deleteImageFromS3({ bucket: process.env.S3_BUCKET, key: img.rows[0].s3_bucket_path });
  await pool.query("DELETE FROM images WHERE image_id=$1", [image_id]);
  res.status(204).end();
}
