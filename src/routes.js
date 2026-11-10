import { Router } from "express";

import filesRouter from './modules/files/files.router.js';
import sessionsRouter from './modules/sessions/sessions.router.js';
import authRouter from './modules/auth/auth.router.js';
import authGoogleRouter from './modules/auth-google/auth-google.router.js';
import usersRouter from './modules/users/users.router.js';

const router = Router();

router.use('/files', filesRouter);
router.use('/sessions', sessionsRouter);
router.use('/auth', authRouter);
router.use('/auth', authGoogleRouter);
router.use('/users', usersRouter);

export default router;