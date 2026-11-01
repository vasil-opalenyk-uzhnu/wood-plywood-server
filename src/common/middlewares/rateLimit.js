import rateLimit from "express-rate-limit"

import { TooManyRequestsError } from '../errors/AppError.js';

export const limiter = (max, windowMs = 15 * 60 * 1000) => rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => next(new TooManyRequestsError('tooManyRequests')),
});