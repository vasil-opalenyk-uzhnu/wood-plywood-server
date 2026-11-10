import { body, header } from "express-validator";

export const deviceIdHeader = [
    header('x-device-id').isUUID().withMessage('invalidDeviceId'),
];

const email = body('email')
    .trim()
    .toLowerCase()
    .exists({ checkFalsy: true }).withMessage('emailIsRequired')
    .isString().withMessage('emailMustBeAString')
    .isEmail().withMessage('emailIsInvalid');
const password = body('password')
    .exists({ checkFalsy: true }).withMessage('passwordIsRequired')
    .isString().withMessage('passwordMustBeAString')
    .isLength({ min: 8, max: 72 }).withMessage('passwordMustBeBetween8And72')
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72).withMessage('passwordTooLongInBytes')
    .isStrongPassword().withMessage('passwordIsWeak');

export const registerRules = [
    email,
    password,
    body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('invalidFirstName'),
    body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('invalidLastName'),
]

export const loginRules = [
    email,
    body('password').isString().notEmpty().withMessage('passwordRequired'),
]

const token = body('token')
    .isString()
    .withMessage('tokenRequired')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('tokenRequired')
    .bail()
    .isLength({ min: 43, max: 43 })
    .withMessage('invalidToken')
    .bail()
    .matches(/^[A-Za-z0-9_-]{43}$/)
    .withMessage('invalidToken');

export const verifyEmailRules = [token];

export const forgotPasswordRules = [email];

export const resetPasswordRules = [token, password];