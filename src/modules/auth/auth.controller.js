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
        
        await authService.register(data);

        return res.json({ message: 'Register successful' });
    }

    async verifyEmail(req, res) {
        const { token } = body(req);

        await authService.confirmEmail(token);

        return res.json({ message: 'Activation successful' });
    }

    async forgotPassword(req, res) {
        const { email } = body(req);

        await authService.forgotPassword(email);

        return res.json({ message: 'Forgot password started' });
    }

    async resetPassword(req, res) {
        const { token, password } = body(req);

        await authService.resetPassword(token, password);

        return res.json({ message: 'Password changed successfully' });
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