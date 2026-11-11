import { Router } from "express";

import { sessionsController } from './sessions.controller.js';
import { idParam } from './sessions.validate.js';

import { auth, requireActiveUser } from '../auth/auth.middleware.js';

import { validate } from '../../common/middlewares/validate.js';
import { limiter } from '../../common/middlewares/rateLimit.js';

const router = Router();

router.use(auth, requireActiveUser);

router.get('/', sessionsController.list);
router.delete('/', limiter(20), sessionsController.revokeOthers);
router.delete('/:id', limiter(20), validate(idParam), sessionsController.revoke);

export default router;