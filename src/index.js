import express from 'express';
import dotenv from 'dotenv';
import v1 from './routes/v1.js';


dotenv.config();
const app = express();


app.use(express.json());
app.use(v1);


// Fallback 404
app.use((req, res) => res.status(404).json({ error: 'not found' }));


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));