import { Router } from "express"

import { usersController } from "./users.controller.js";
import { updateMeRules } from "./users.validation.js";

import { auth } from "../auth/auth.middleware.js";

import { validate } from "../../common/middlewares/validate.js";
import { limiter } from '../../common/middlewares/rateLimit.js';

const router = new Router();

router.post('/update-me', limiter(20), auth, validate(updateMeRules), usersController.updateProfile);

export default router;