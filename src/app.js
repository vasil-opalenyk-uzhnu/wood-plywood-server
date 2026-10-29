import 'dotenv/config';

import express from 'express';
import cors from 'cors';

import router from './routes.js';

const app = express();

app.use(express.json());
app.use(cors({
    origin: '*' || process.env.CLIENT,
    credentials: true
}))
app.use('/api', router);

export default app;