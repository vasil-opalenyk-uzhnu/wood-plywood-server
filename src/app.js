import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { notFound } from './common/middlewares/notFound.js';
import { errorHandler } from './common/middlewares/errorHandler.js';

import router from './routes.js';

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        if (!origin) return callback(null, true);
        return callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api', router);
app.use(notFound);
app.use(errorHandler);

export default app;