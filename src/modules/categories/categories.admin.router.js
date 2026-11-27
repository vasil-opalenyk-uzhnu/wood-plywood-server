import { Router } from 'express';

import { categoriesController } from './categories.controller.js';
import { createCategoryRules, updateCategoryRules, idParam } from './categories.validation.js';

import { auth, requireActiveUser, requireRole } from '../auth/auth.middleware.js';
import { UsersRoles } from '../users/users.roles.js';

import { validate } from '../../common/middlewares/validate.js';
import { limiter } from '../../common/middlewares/rateLimit.js';

const router = new Router();

router.use(auth, requireActiveUser, requireRole(UsersRoles.owner, UsersRoles.employee));

router.get('/', categoriesController.adminList);
router.get('/:id', validate(idParam), categoriesController.adminGet);
router.post('/', limiter(60), validate(createCategoryRules), categoriesController.create);
router.patch('/:id', limiter(60), validate([...idParam, ...updateCategoryRules]), categoriesController.update);
router.delete('/:id', limiter(60), validate(idParam), categoriesController.delete);

export default router;