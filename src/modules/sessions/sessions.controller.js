import { sessionsService } from './sessions.service.js';
import { toSessionResponse } from '../../common/dto/sessionResponse.dto.js';

class SessionsController {
    async list(req, res) {
        const userId = req.user.id;
        const currentSessionId = req.sid;

        const sessions = await sessionsService.list(userId, currentSessionId);

        return res.json({ sessions: sessions.map((session) => toSessionResponse(session, currentSessionId)) });
    }

    async revoke(req, res) {
        const userId = req.user.id;
        const sessionId = req.params.id;

        await sessionsService.remove(userId, sessionId);

        return res.json({ message: 'Session revoked successfully'});
    }

    async revokeOthers(req, res) {
        const userId = req.user.id;
        const currentSessionId = req.sid;
        
        await sessionsService.removeOthers(userId, currentSessionId);

        return res.json({ message: 'All other sessions revoked successfully'});
    }
}

export const sessionsController = new SessionsController();