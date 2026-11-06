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

export const verifyEmailRules = [
    body('code').trim().matches(/^\d{6}$/).withMessage('invalidCode'),
];