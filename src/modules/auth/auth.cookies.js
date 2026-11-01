import { REFRESH_TTL_MS } from '../sessions/sessions.tokens.js';

export const REFRESH_COOKIE = 'refreshToken';

const options = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
});

export const setRefreshCookie = (res, token) => {
    return res.cookie(REFRESH_COOKIE, token, { ...options(), maxAge: REFRESH_TTL_MS });
}

export const clearRefreshCookie = (res) => {
    return res.clearCookie(REFRESH_COOKIE, options());
}