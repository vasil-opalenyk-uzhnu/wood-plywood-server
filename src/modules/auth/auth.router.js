import { Router } from "express";

import { authController } from "./auth.controller.js";
import { auth, deviceMeta, requireActiveUser } from "./auth.middleware.js";
import { loginRules, registerRules, deviceIdHeader, verifyEmailRules } from "./auth.validation.js";

import { validate } from "../../common/middlewares/validate.js";
import { limiter } from "../../common/middlewares/rateLimit.js";

const router = new Router();

router.post('/email/login', limiter(20), validate([...deviceIdHeader, ...loginRules]), deviceMeta, authController.login);
router.post('/email/register', limiter(10), validate([...deviceIdHeader, ...registerRules]), deviceMeta, authController.register);
router.post('/email/verify-email', limiter(20), auth, validate([...verifyEmailRules]), authController.verifyEmail);

router.post('/refresh', limiter(60), deviceMeta, authController.refresh);
router.post('/logout', limiter(20), authController.logout);

router.get('/me', limiter(30), auth, requireActiveUser, authController.me);

export default router;