import { Router } from 'express';

import { categoriesController } from './categories.controller.js';
import { slugParam } from './categories.validation.js';

import { resolveLocale } from '../localization/localization.middleware.js';

import { validate } from '../../common/middlewares/validate.js';

const router = new Router();

router.use(resolveLocale);

router.get('/', categoriesController.list);
router.get('/:slug', validate(slugParam), categoriesController.getBySlug);

export default router;