import { sessionsService } from "../sessions/sessions.service.js";
import { verifyAccessToken } from "../sessions/sessions.tokens.js";
import { usersService } from "../users/users.service.js";

import { ForbiddenError, UnauthorizedError } from "../../common/errors/AppError.js";

export const deviceMeta = (req, res, next) => {
    req.deviceMeta = {
        deviceId: req.get('x-device-id'),
        userAgent: req.get('user-agent') || undefined,
        ip: req.ip,
    };
    next();
}

export const auth = async (req, res, next) => {
    const header = req.headers.authorization;
    if(!header?.startsWith('Bearer ')) throw new UnauthorizedError('tokenRequired');

    let payload;
    try {
        payload = verifyAccessToken(header.slice(7));
    }catch(err) {
        throw new UnauthorizedError(err.name === 'TokenExpiredError' ? 'tokenExpired' : 'invalidToken');
    }

    if(!await sessionsService.exists(payload.sub, payload.sid)) {
        throw new UnauthorizedError('sessionRevoked');
    }

    const user = await usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedError('invalidToken');

    req.user = user;
    req.sid = payload.sid;
    next();
}

export const requireActiveUser = (req, res, next) => {
    if (req.user?.status !== 'active') {
        throw new ForbiddenError('emailNotVerified');
    }
    next();
};
