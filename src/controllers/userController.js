// src/controllers/userController.js

import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import pool from "../db/pool.js";

import {
  createUser,
  getUserByUsername,
  getUserPublicById,
  updateUser,
} from "../models/userModel.js";
import {
  validateNewUser,
  validateUserUpdate,
} from "../utils/validate.js";

const SALT_ROUNDS = 10;
const IS_TEST = process.env.NODE_ENV === "test";

// ---------- SNS SETUP ----------

const sns = new SNSClient({ region: process.env.AWS_REGION || "us-east-1" });
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

async function publishSignup(email, token) {
  if (!SNS_TOPIC_ARN) {
    console.warn("SNS_TOPIC_ARN is not set; skipping email publish");
    return;
  }

  const msg = JSON.stringify({
    email,
    token,
    ts: Date.now(),
  });

  await sns.send(
    new PublishCommand({
      TopicArn: SNS_TOPIC_ARN,
      Message: msg,
    })
  );
}

// ---------- HANDLERS ----------

/**
 * POST /v1/user (public)
 * 201 Created + user JSON (no password fields)
 * 400 Bad Request
 * 409 Conflict (duplicate username)
 */
export async function createUserHandler(req, res) {
  try {
    const err = validateNewUser(req.body);
    if (err) return res.status(400).json({ error: err });

    const { first_name, last_name, username, password } = req.body;

    const existing = await getUserByUsername(username);
    if (existing) {
      return res.status(409).json({ error: "username already exists" });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser({
      first_name,
      last_name,
      username,
      password_hash,
    });

    // ---- NEW FOR ASSIGNMENT 09 ----
    // Skip email verification flow in tests so Jest doesn't need the extra table or SNS.
    if (!IS_TEST) {
      const email = username.toLowerCase();
      const token = uuidv4();

      // store token with 1-minute expiry
      await pool.query(
        `
        INSERT INTO email_verifications (email, token, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '1 minute')
        `,
        [email, token]
      );

      // publish to SNS so Lambda can send email
      await publishSignup(email, token);
    }

    // DON'T send password hash back
    return res.status(201).json(user);
  } catch (e) {
    if (e && e.code === "23505") {
      return res.status(409).json({ error: "username already exists" });
    }
    console.error("createUserHandler error:", e);
    return res.status(500).json({ error: "internal error" });
  }
}

/**
 * GET /v1/user/:userId (Basic auth)
 * 200 OK + user JSON
 * 403 Forbidden if not self
 * 404 Not Found
 */
export async function getUserHandler(req, res) {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId) {
      return res.status(403).json({ error: "forbidden" });
    }

    const u = await getUserPublicById(userId);
    if (!u) return res.status(404).json({ error: "not found" });

    return res.json(u);
  } catch (e) {
    console.error("getUserHandler error:", e);
    return res.status(500).json({ error: "internal error" });
  }
}

/**
 * PUT /v1/user/:userId (Basic auth)
 * 204 No Content
 * 400 Bad Request
 * 403 Forbidden if not self
 * 404 Not Found
 */
export async function putUserHandler(req, res) {
  try {
    const { userId } = req.params;
    if (req.user.id !== userId) {
      return res.status(403).json({ error: "forbidden" });
    }

    const err = validateUserUpdate(req.body);
    if (err) return res.status(400).json({ error: err });

    // ensure user exists
    const exists = await getUserPublicById(userId);
    if (!exists) return res.status(404).json({ error: "not found" });

    const patch = {};
    if (req.body.first_name !== undefined) patch.first_name = req.body.first_name;
    if (req.body.last_name !== undefined) patch.last_name = req.body.last_name;
    if (req.body.password !== undefined) {
      patch.password_hash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    }

    await updateUser(userId, patch);
    return res.status(204).send();
  } catch (e) {
    console.error("putUserHandler error:", e);
    return res.status(500).json({ error: "internal error" });
  }
}

/**
 * GET /validateEmail?email=...&token=...
 * 204 No Content on success
 * 400 on invalid/expired/used token
 */
export async function validateEmailHandler(req, res) {
  const { email, token } = req.query;

  if (!email || !token) {
    return res.status(400).json({ error: "missing email or token" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM email_verifications WHERE token = $1`,
      [token]
    );

    const record = rows[0];

    // token not found or email mismatch
    if (
      !record ||
      record.email.toLowerCase() !== String(email).toLowerCase()
    ) {
      return res.status(400).json({ error: "invalid token" });
    }

    // already used
    if (record.consumed) {
      return res.status(400).json({ error: "token already used" });
    }

    // expired
    const now = new Date();
    const expiresAt = new Date(record.expires_at);
    if (expiresAt < now) {
      return res.status(400).json({ error: "token expired" });
    }

    // mark user verified + token consumed (transaction)
    await pool.query("BEGIN");

    await pool.query(
      `
      UPDATE users
      SET email_verified = TRUE,
          account_updated = NOW()
      WHERE username = $1
      `,
      [email]
    );

    await pool.query(
      `
      UPDATE email_verifications
      SET consumed = TRUE
      WHERE token = $1
      `,
      [token]
    );

    await pool.query("COMMIT");

    return res.status(204).send();
  } catch (e) {
    console.error("validateEmailHandler error:", e);
    try {
      await pool.query("ROLLBACK");
    } catch (_) {
      // ignore
    }
    return res
      .status(400)
      .json({ error: "invalid or expired token" });
  }
}
