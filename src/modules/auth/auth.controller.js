import { matchedData } from "express-validator";

import { authService } from "./auth.service.js";
import { toUserResponse } from '../../common/dto/userResponse.dto.js';
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie } from "./auth.cookies.js";

const body = (req) => matchedData(req, { locations: ['body'] });

class AuthController {
    async login(req, res) {
        const data = body(req);
        const deviceMeta = req.deviceMeta;
        const { accessToken, refreshToken } = await authService.validatelogin(data, deviceMeta);

        setRefreshCookie(res, refreshToken);
        
        return res.json({ message: 'Login successful', accessToken });
    }

    async register(req, res) {
        const data = body(req);
        const deviceMeta = req.deviceMeta;
        const { accessToken, refreshToken } = await authService.register(data, deviceMeta);

        setRefreshCookie(res, refreshToken);
        
        return res.json({ message: 'Register successful', accessToken });
    }

    async verifyEmail(req, res) {
        const userId = req.user.id;
        const { code } = body(req);

        await authService.confirmEmail(code, userId);

        return res.json({ message: 'Activation successful' });
    }

    async refresh(req, res) {
        const oRefreshToken = req.cookies?.[REFRESH_COOKIE];
        const deviceMeta = req.deviceMeta;
        const { accessToken, refreshToken } = await authService.refresh(oRefreshToken, deviceMeta);

        if (refreshToken) setRefreshCookie(res, refreshToken);

        return res.json({ message: 'Refresh successful', accessToken });
    }

    async logout(req, res) {
        const refreshToken = req.cookies?.[REFRESH_COOKIE];
        await authService.logout(refreshToken);

        clearRefreshCookie(res);

        return res.json({ message: 'Logout successful' });
    }

    async me(req, res) {
        const userId = req.user.id;
        const user = await authService.me(userId);

        return res.json({ user: toUserResponse(user) });
    }
}

export const authController = new AuthController();