// src/routes/v1.js

import multer from "multer";
import { Router } from "express";

import {
  uploadImageHandler,
  listImagesHandler,
  getImageHandler,
  deleteImageHandler,
} from "../controllers/imageController.js";

import { requireBasicAuth } from "../middleware/auth.js";
import { requireJson } from "../middleware/requireJson.js";

import {
  createUserHandler,
  getUserHandler,
  putUserHandler,
  validateEmailHandler,
} from "../controllers/userController.js";

import {
  publicGetProduct,
  createProductHandler,
  putProductHandler,
  patchProductHandler,
  deleteProductHandler,
} from "../controllers/productController.js";

const upload = multer({ storage: multer.memoryStorage() });
const r = Router();

// PUBLIC
r.get("/healthz", (req, res) => res.status(200).send());
r.get("/cicd", (req, res) => res.status(200).send());
r.post("/v1/user", requireJson, createUserHandler);
r.get("/v1/product/:productId", publicGetProduct);

// NEW: email verification endpoint (no auth, link from email)
r.get("/validateEmail", validateEmailHandler);

// AUTHENTICATED (Basic Auth)
// NOTE: requireJson must come BEFORE auth for write ops to produce 415 first.
r.get("/v1/user/:userId", requireBasicAuth, getUserHandler);
r.put("/v1/user/:userId", requireJson, requireBasicAuth, putUserHandler);

r.post("/v1/product", requireJson, requireBasicAuth, createProductHandler);
r.put(
  "/v1/product/:productId",
  requireJson,
  requireBasicAuth,
  putProductHandler
);
r.patch(
  "/v1/product/:productId",
  requireJson,
  requireBasicAuth,
  patchProductHandler
);
r.delete("/v1/product/:productId", requireBasicAuth, deleteProductHandler);

r.post(
  "/v1/product/:product_id/image",
  requireBasicAuth,
  upload.single("file"),
  uploadImageHandler
);
r.get(
  "/v1/product/:product_id/image",
  requireBasicAuth,
  listImagesHandler
);
r.get(
  "/v1/product/:product_id/image/:image_id",
  requireBasicAuth,
  getImageHandler
);
r.delete(
  "/v1/product/:product_id/image/:image_id",
  requireBasicAuth,
  deleteImageHandler
);

export default r;
