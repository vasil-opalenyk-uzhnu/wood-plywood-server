import mongoose from "mongoose";
import { body } from "express-validator";

export const updateMeRules = [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('invalidFirstName'),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('invalidLastName'),
    body('profilePicture')
        .custom((value) => {
            if (value === undefined) {
                return true;
            }

            if (value === null) {
                return true;
            }

            if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
                return true;
            }

            throw new Error('InvalidProfilePicture');
        }),
];