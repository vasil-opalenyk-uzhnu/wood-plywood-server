import crypto from 'crypto';

import { accountTokens } from './account-tokens.model.js';
import { AccountTokensPurposes } from './account-tokens.purposes.js';

import { BadRequestError } from '../../common/errors/AppError.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const COOLDOWN_MS = Number(process.env.ACCOUNT_TOKENS_COOLDOWN_MS) || 60_000;

const PURPOSES = {
    [AccountTokensPurposes.verifyEmail]: {
        ttlEnv: 'ACCOUNT_TOKENS_VERIFY_EMAIL_TTL_MIN',
        ttlDefault: 24 * 60,
        urlEnv: 'ACTIVATE_CLIENT_URL',
    },
    [AccountTokensPurposes.resetPassword]: {
        ttlEnv: 'ACCOUNT_TOKENS_RESET_PASSWORD_TTL_MIN',
        ttlDefault: 15,
        urlEnv: 'RESET_PASSWORD_CLIENT_URL',
    },
};

class AccountTokensService {
    ttlMinutes(purpose) {
        const { ttlEnv, ttlDefault } = PURPOSES[purpose];
        return Number(process.env[ttlEnv]) || ttlDefault;
    }

    buildLink(purpose, token) {
        const { urlEnv } = PURPOSES[purpose];
        const base = process.env[urlEnv];

        let url;
        try {
            url = new URL(base);
        } catch {
            throw new Error(`${urlEnv} is not set or is not a valid URL`);
        }

        url.searchParams.set('token', token);
        return url.toString();
    }

    assertConfigured(purpose) {
        this.buildLink(purpose, 'check');
    }

    async create(userId, purpose) {
        const existing = await accountTokens.findOne({ userId, purpose });
        if(existing && Date.now() - existing.sentAt.getTime() < COOLDOWN_MS) return null;

        const token = crypto.randomBytes(32).toString('base64url');
        const ttlMinutes = this.ttlMinutes(purpose);
        const link = this.buildLink(purpose, token);

        try {
            await accountTokens.findOneAndUpdate(
                { userId, purpose },
                {
                    $set: {
                        tokenHash: hashToken(token),
                        sentAt: new Date(),
                        expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
                    }
                },
                { upsert: true }
            );
        } catch (err) {
            if (err.code === 11000) return null;
            throw err;
        }

        return { link, ttlMinutes };
    }

    async verify(token, purpose) {
        const record = await accountTokens.findOneAndDelete({
            purpose,
            tokenHash: hashToken(token),
            expiresAt: { $gt: new Date() },
        });

        if(!record) throw new BadRequestError('invalidToken');

        return record.userId;
    }

    revokeAll(userId) {
        return accountTokens.deleteMany({ userId });
    }
}

export const accountTokensService = new AccountTokensService();