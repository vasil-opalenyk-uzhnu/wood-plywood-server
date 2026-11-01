import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { isValidObjectId } from 'mongoose';

const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TTL_DAYS) || 30;
export const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;

export const signAccessToken = ({ userId, sessionId }) => {
    return jwt.sign(
        { sub: String(userId), sid: String(sessionId) },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
    )
}

export const verifyAccessToken = (token) => {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });

    if (!isValidObjectId(payload.sub) || !isValidObjectId(payload.sid)) {
        throw new jwt.JsonWebTokenError('invalid payload');
    }

    return payload;
}

export const signRefreshToken = ({ userId, sessionId }) => {
    return jwt.sign(
        { sub: String(userId), sid: String(sessionId), jti: crypto.randomUUID() },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: Math.floor(REFRESH_TTL_MS / 1000) }
    )
}

export function verifyRefreshToken(token) {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] });

    if (!isValidObjectId(payload.sub) || !isValidObjectId(payload.sid) || typeof payload.jti !== 'string') {
        throw new jwt.JsonWebTokenError('invalid payload');
    }

    return payload;
}

export function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}