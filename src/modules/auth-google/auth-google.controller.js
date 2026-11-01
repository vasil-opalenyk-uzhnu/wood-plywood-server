import { matchedData } from 'express-validator';

import { authGoogleService } from './auth-google.service.js';

import { authService } from '../auth/auth.service.js';
import { setRefreshCookie } from '../auth/auth.cookies.js';

const body = (req) => matchedData(req, { locations: ['body'] });

class AuthGoogleController {
    async login(req, res) {
        const { idToken } = body(req);
        const deviceMeta = req.deviceMeta;
    
        const socialData = await authGoogleService.getProfileByToken(idToken);
        const { accessToken, refreshToken } = await authService.validateSocialLogin('google', socialData, deviceMeta);
        
        setRefreshCookie(res, refreshToken);
                
        return res.json({ message: 'Login successful', accessToken });
    }
}

export const authGoogleController = new AuthGoogleController();