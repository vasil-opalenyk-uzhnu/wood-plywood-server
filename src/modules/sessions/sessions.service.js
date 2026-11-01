import crypto from 'node:crypto';
import { UAParser } from 'ua-parser-js';

import { sessions } from './sessions.model.js';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken, REFRESH_TTL_MS } from './sessions.tokens.js';

import { NotFoundError, UnauthorizedError } from '../../common/errors/AppError.js';

const MAX_SESSIONS = Number(process.env.MAX_SESSIONS) || 5;

const newExpiry = () => new Date(Date.now() + REFRESH_TTL_MS);

class SessionsService {
    async add(user, { deviceId, userAgent, ip }) {
        const session = await sessions.findOneAndUpdate(
            { userId: user._id, deviceId },
            {
                $set: {
                    refreshHash: hashToken(crypto.randomUUID()),
                    userAgent,
                    ip,
                    expiresAt: newExpiry(),
                },
            },
            { upsert: true, returnDocument: 'after' }
        );

        const refreshToken = signRefreshToken({ userId: user._id, sessionId: session._id });
        await sessions.updateOne(
            { _id: session._id },
            { $set: { refreshHash: hashToken(refreshToken) } }
        );

        await this.enforceLimit(user._id);

        return {
            accessToken: signAccessToken({ userId: user._id, sessionId: session._id }),
            refreshToken,
        };
    }

    async update(refreshToken, { ip }) {
        if (!refreshToken) throw new UnauthorizedError('refreshTokenRequired');

        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            throw new UnauthorizedError('invalidRefreshToken');
        }

        const newRefreshToken = signRefreshToken({ userId: payload.sub, sessionId: payload.sid });

        const session = await sessions.findOneAndUpdate(
            {
                _id: payload.sid,
                userId: payload.sub,
                refreshHash: hashToken(refreshToken),
                expiresAt: { $gt: new Date() },
            },
            {
                $set: {
                    refreshHash: hashToken(newRefreshToken),
                    expiresAt: newExpiry(),
                    ...(ip && { ip }),
                },
            },
            { returnDocument: 'after' }
        );

        if (!session) throw new UnauthorizedError('invalidRefreshToken');

        return {
            accessToken: signAccessToken({ userId: payload.sub, sessionId: session._id}),
            refreshToken: newRefreshToken,
        };
    }

    async remove(userId, sessionId) {
        const res = await sessions.deleteOne({ _id: sessionId, userId });
        if (!res.deletedCount) throw new NotFoundError('sessionNotFound');
    }

    async removeByRefresh(refreshToken) {
        if (!refreshToken) return;
        await sessions.deleteOne({ refreshHash: hashToken(refreshToken) });
    }

    removeOthers(userId, currentSessionId) {
        return sessions.deleteMany({ userId, _id: { $ne: currentSessionId } });
    }

    removeAll(userId) {
        return sessions.deleteMany({ userId });
    }

    exists(userId, sessionId) {
        return sessions.exists({ _id: sessionId, userId, expiresAt: { $gt: new Date() } })
    }

    async list(userId, currentSessionId) {
        const items = await sessions.find({ userId, expiresAt: { $gt: new Date() } }).sort({ updatedAt: -1 });

        return items.map((session) => {
            const ua = new UAParser(session.userAgent || '').getResult();

            return {
                _id: session._id,
                browser: ua.browser.name || 'Unknown',
                os: ua.os.name || 'Unknown',
                device: ua.device.model || ua.device.type || 'Desktop',
                ip: session.ip,
                lastActiveAt: session.updatedAt,
                createdAt: session.createdAt,
            };
        });
    }

    async enforceLimit(userId) {
        const count = await sessions.countDocuments({ userId });
        if(count <= MAX_SESSIONS) return;

        const oldest = await sessions
            .find({ userId })
            .sort({ updatedAt: 1 })
            .limit(count - MAX_SESSIONS)
            .select('_id');

        await sessions.deleteMany({ _id: { $in: oldest.map((s) => s._id) } });
    }
}

export const sessionsService = new SessionsService();