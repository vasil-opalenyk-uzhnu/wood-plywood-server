import { body } from 'express-validator';

const email = body('email')
    .trim()
    .toLowerCase()
    .exists({ checkFalsy: true }).withMessage('emailIsRequired')
    .isString().withMessage('emailMustBeAString')
    .isEmail().withMessage('emailIsInvalid');

export const forgotPasswordRules = [email];

export const verifyResetCodeRules = [
    email,
    body('code').trim().matches(/^\d{6}$/).withMessage('invalidCode'),
];

export const resetPasswordRules = [
    body('resetToken').isString().isLength({ min: 40, max: 60 }).withMessage('invalidResetToken'),
    body('password')
        .isString().bail()
        .isLength({ min: 8, max: 72 }).withMessage('invalidPassword')
        .custom((value) => Buffer.byteLength(value, 'utf8') <= 72).withMessage('passwordTooLongInBytes'),
];