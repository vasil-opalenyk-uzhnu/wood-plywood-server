import { body, header } from "express-validator";

export const deviceIdHeader = [
    header('x-device-id').isUUID().withMessage('invalidDeviceId'),
];

export const googleRules = [
    body('idToken').isString().notEmpty().withMessage('idTokenRequired'),
];