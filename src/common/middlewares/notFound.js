import { NotFoundError } from '../errors/AppError.js';

export const notFound = (req, res, next) => next(new NotFoundError('routeNotFound'));