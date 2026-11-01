export const toSessionResponse = (session, currentSessionId) => {
    return {
        id: String(session._id),
        browser: session.browser,
        os: session.os,
        device: session.device,
        ip: session.ip ?? null,
        lastActiveAt: session.lastActiveAt,
        createdAt: session.createdAt,
        isCurrent: String(session._id) === String(currentSessionId),
    };
};
