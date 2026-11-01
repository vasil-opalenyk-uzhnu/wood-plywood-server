import crypto from 'crypto';

export const generateActivationCode = () =>
    crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');