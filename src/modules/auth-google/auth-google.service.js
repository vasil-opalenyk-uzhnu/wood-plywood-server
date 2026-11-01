import { OAuth2Client } from 'google-auth-library';
import { UnauthorizedError } from '../../common/errors/AppError.js';

class AuthGoogleService {
    constructor() {
        this.google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    async getProfileByToken(idToken) {
        let payload;
        try {
            if (!process.env.GOOGLE_CLIENT_ID) {
                throw new Error('GOOGLE_CLIENT_ID is not configured');
            }

            const ticket = await this.google.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch {
            throw new UnauthorizedError('invalidGoogleToken');
        }

        if (!payload?.sub) throw new UnauthorizedError('invalidGoogleToken');
        if (!payload.email || payload.email_verified !== true) {
            throw new UnauthorizedError('googleEmailRequired');
        }

        return {
            id: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified === true,
            firstName: payload.given_name,
            lastName: payload.family_name,
            picture: payload.picture,
        };
    }
}

export const authGoogleService = new AuthGoogleService();
