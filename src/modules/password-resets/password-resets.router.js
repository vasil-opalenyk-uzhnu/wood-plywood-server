import { Router } from "express";

import { passwordResetsController } from "./password-resets.contoller.js";
import { forgotPasswordRules, verifyResetCodeRules, resetPasswordRules } from './password-resets.validation.js';

import { validate } from "../../common/middlewares/validate.js";
import { limiter } from "../../common/middlewares/rateLimit.js";

const router = new Router();

router.post('/forgot/password',        limiter(5),  validate(forgotPasswordRules),  passwordResetsController.forgotPassword);
router.post('/forgot/password/verify', limiter(10), validate(verifyResetCodeRules), passwordResetsController.verifyCode);
router.post('/reset/password',         limiter(10), validate(resetPasswordRules),   passwordResetsController.resetPassword);

export default router;