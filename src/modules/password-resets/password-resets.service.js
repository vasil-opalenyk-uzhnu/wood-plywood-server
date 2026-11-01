import crypto from 'crypto';

import { passwordResets } from './password-resets.model.js';

import { usersService } from '../users/users.service.js';
import { UsersStatus } from '../users/users.status.js';
import { AuthProviders } from '../auth/auth.providers.js';
import { mailerService } from '../mailer/mailer.service.js';
import { sessionsService } from '../sessions/sessions.service.js';

import { generateActivationCode } from '../../common/utils/generateActivationCode.js';
import { BadRequestError } from '../../common/errors/AppError.js';

const hashCode = (userId, code) =>
    crypto.createHmac('sha256', process.env.PASSWORD_RESETS_SECRET)
        .update(`reset:${userId}:${code}`)
        .digest('hex');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const COOLDOWN_MS = Number(process.env.PASSWORD_RESETS_COOLDOWN_MS) || 60_000;
const CODE_TTL_MIN = Number(process.env.PASSWORD_RESETS_CODE_TTL_MIN) || 10;
const TOKEN_TTL_MIN = Number(process.env.PASSWORD_RESETS_TOKEN_TTL_MIN) || 10;
const MAX_ATTEMPTS = Number(process.env.PASSWORD_RESETS_MAX_ATTEMPTS) || 5;

class PasswordResetService {
    async request(email) {
        const user = await usersService.findByEmail(email);
        if(!user || user.provider !== AuthProviders.email || user.status !== UsersStatus.active) return;
    
        const existing = await passwordResets.findOne({ userId: user._id });
        if (existing && Date.now() - existing.sentAt.getTime() < COOLDOWN_MS) return;

        const code = generateActivationCode();

        await passwordResets.findOneAndUpdate(
            { userId: user._id },
            {
                $set: {
                    codeHash: hashCode(user._id, code),
                    attempts: 0,
                    sentAt: new Date(),
                    expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60 * 1000),
                },
                $unset: { tokenHash: 1 },
            },
            { upsert: true }
        )

        mailerService.sendPasswordResetCode(user.email, code, CODE_TTL_MIN)
            .catch((err) => console.error('Reset mail failed:', err.message));
    }

    async verify(email, code) {
        const user = await usersService.findByEmail(email);
        if(!user || user.provider !== AuthProviders.email) throw new BadRequestError('invalidCode');

        const record = await passwordResets.findOneAndUpdate(
            {
                userId: user._id,
                codeHash: { $exists: true },
                expiresAt: { $gt: new Date() },
                attempts: { $lt: MAX_ATTEMPTS },
            },
            { $inc: { attempts: 1 } },
            { returnDocument: 'after' }
        );
        if(!record) throw new BadRequestError('invalidCode');

        const a = Buffer.from(record.codeHash);
        const b = Buffer.from(hashCode(user._id, code));
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
            throw new BadRequestError('invalidCode');
        }

        const resetToken = crypto.randomBytes(32).toString('base64url');

        await passwordResets.updateOne(
            { _id: record._id },
            {
                $set: {
                    tokenHash: hashToken(resetToken),
                    expiresAt: new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000),
                },
                $unset: { codeHash: 1 },
            }
        );
        
        return { resetToken };
    }

    async reset(resetToken, password) {
        const record = await passwordResets.findOneAndDelete({
            tokenHash: hashToken(resetToken),
            expiresAt: { $gt: new Date() },
        });
        if (!record) throw new BadRequestError('invalidResetToken');

        await usersService.update(record.userId, { password });
        await sessionsService.removeAll(record.userId);
    }
}

export const passwordResetsService = new PasswordResetService();