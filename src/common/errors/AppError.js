export class AppError extends Error {
    constructor(statusCode, code, details) {
        super(code);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
    }
}

export class BadRequestError extends AppError {
    constructor(code = 'badRequest', details) { super(400, code, details); }
}
export class UnauthorizedError extends AppError {
    constructor(code = 'unauthorized') { super(401, code); }
}
export class ForbiddenError extends AppError {
    constructor(code = 'forbidden') { super(403, code); }
}
export class NotFoundError extends AppError {
    constructor(code = 'notFound') { super(404, code); }
}
export class ConflictError extends AppError {
    constructor(code = 'conflict', details) { super(409, code, details); }
}
export class RequestValidationError extends AppError {
    constructor(details) { super(422, 'validationFailed', details); }
}
export class TooManyRequestsError extends AppError {
    constructor(code = 'tooManyRequests') { super(429, code); }
}