import multer from 'multer';
import { AppError, BadRequestError, ConflictError, RequestValidationError } from '../errors/AppError.js';

function normalize(err) {
    if (err instanceof AppError) return err;

    if (err.name === 'ValidationError' && err.errors) {
        return new RequestValidationError(
            Object.values(err.errors).map(e => ({ field: e.path, message: e.kind }))
        );
    }

    if (err.name === 'CastError') return new BadRequestError('invalidId');

    if (err.code === 11000) {
        return new ConflictError('duplicateKey', Object.keys(err.keyPattern || {}));
    }

    if (err instanceof multer.MulterError) {
        const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        return new AppError(status, err.code === 'LIMIT_FILE_SIZE' ? 'fileTooLarge' : 'uploadError');
    }

    if (err.type === 'entity.parse.failed') return new BadRequestError('invalidJson');

    const unknown = new AppError(500, 'internalError');
    unknown.isOperational = false;
    return unknown;
}

export function errorHandler(err, req, res, next) {
    if (res.headersSent) return next(err);

    const error = normalize(err);

    if (!error.isOperational) console.error(err);

    res.status(error.statusCode).json({
        error: {
            code: error.code,
            message: error.message,
            ...(error.details && { details: error.details }),
            ...(process.env.NODE_ENV !== 'production' && !error.isOperational && { stack: err.stack }),
        },
    });
}