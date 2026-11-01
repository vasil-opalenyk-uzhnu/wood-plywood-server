import { Router } from "express";

import { authGoogleController } from "./auth-google.controller.js";
import { deviceIdHeader, googleRules } from "./auth-google.validation.js";

import { deviceMeta } from "../auth/auth.middleware.js";

import { validate } from "../../common/middlewares/validate.js";
import { limiter } from '../../common/middlewares/rateLimit.js';

const router = new Router();

router.post('/google/login', limiter(20), validate([...deviceIdHeader, ...googleRules]), deviceMeta, authGoogleController.login);

export default router;