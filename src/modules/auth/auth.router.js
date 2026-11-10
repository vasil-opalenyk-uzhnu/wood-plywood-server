import { Router } from "express";

import { authController } from "./auth.controller.js";
import { auth, deviceMeta } from "./auth.middleware.js";
import { loginRules, registerRules, deviceIdHeader, verifyEmailRules, forgotPasswordRules, resetPasswordRules } from "./auth.validation.js";

import { validate } from "../../common/middlewares/validate.js";
import { limiter } from "../../common/middlewares/rateLimit.js";

const router = new Router();

router.post('/email/login', limiter(20), validate([...deviceIdHeader, ...loginRules]), deviceMeta, authController.login);
router.post('/email/register', limiter(10), validate([...deviceIdHeader, ...registerRules]), authController.register);
router.post('/email/verify-email', limiter(20), validate([...verifyEmailRules]), authController.verifyEmail);

router.post('/forgot/password', limiter(5), validate(forgotPasswordRules), authController.forgotPassword);
router.post('/reset/password', limiter(10), validate(resetPasswordRules), authController.resetPassword);

router.post('/refresh', deviceMeta, authController.refresh);
router.post('/logout', authController.logout);

router.get('/me', auth, authController.me);

export default router;