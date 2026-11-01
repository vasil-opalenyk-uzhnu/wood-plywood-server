import { validationResult } from 'express-validator';
import { RequestValidationError } from '../errors/AppError.js';

export const validate = (rules = []) => [
    ...rules,
    (req, _, next) => {
        const result = validationResult(req);
        if (result.isEmpty()) return next();

        const details = result.array({ onlyFirstError: true }).map(e => ({
            field: e.path,
            location: e.location,
            message: e.msg,
        }));

        next(new RequestValidationError(details));
    },
]