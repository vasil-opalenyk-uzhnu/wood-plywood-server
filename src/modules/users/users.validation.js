import { body } from "express-validator";

export const updateMeRules = [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('invalidFirstName'),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('invalidLastName'),
    body('profilePicture').optional({ values: 'null' }).isMongoId().withMessage('invalidId'),
];