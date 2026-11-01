import { param } from 'express-validator';

export const idParam = [
    param('id').isMongoId().withMessage('invalidId'),
];