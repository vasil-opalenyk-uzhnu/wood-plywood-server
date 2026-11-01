import { matchedData } from 'express-validator';
import { passwordResetsService } from './password-resets.service.js';

const body = (req) => matchedData(req, { locations: ['body'] });

class PasswordResetsController {
    async forgotPassword(req, res) {
        const { email } = body(req);

        await passwordResetsService.request(email);
        
        res.json({ message: 'Forgot password started' });
    }

    async verifyCode(req, res) {
        const { email, code } = body(req);
        const { resetToken } = await passwordResetsService.verify(email, code);

        res.json({ message: 'Code successfully verified', resetToken });
    }

    async resetPassword(req, res) {
        const { resetToken, password } = body(req);

        await passwordResetsService.reset(resetToken, password);

        res.json({ message: 'Password changed successfully' });
    }
}

export const passwordResetsController = new PasswordResetsController();