import express from 'express';
import dotenv from 'dotenv';
import v1 from './routes/v1.js';

// Load .env.test for test runs, otherwise .env
dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  // quiet: true, // uncomment to silence dotenv logs if they bother you
});

const app = express();
app.use(express.json());
app.use(v1);
app.use((req, res) => res.status(404).json({ error: 'not found' }));

export default app;
