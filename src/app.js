// src/app.js
import express from 'express';
import dotenv from 'dotenv';
import v1 from './routes/v1.js';
import morgan from 'morgan';                 // add
import { statsd } from './metrics.js';       // add

dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
});

const app = express();

app.use(morgan('combined'));                 // keep access log lines

// Count + time every request
app.use((req, res, next) => {
  const start = Date.now();
  const pathKey = req.path.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '') || 'root';
  const base = `api.${req.method}.${pathKey}`;
  statsd.increment(`${base}.count`);
  res.on('finish', () => {
    const ms = Date.now() - start;
    statsd.timing(`${base}.duration_ms`, ms);
    statsd.increment(`${base}.status.${res.statusCode}`);
  });
  next();
});

app.use(express.json());
app.use(v1);
app.use((req, res) => res.status(404).json({ error: 'not found' }));

export default app;
