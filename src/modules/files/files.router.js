import { Router } from "express";
import multer from 'multer';

import { filesController } from './files.controller.js';
import { idParam } from './files.validation.js';

import { auth, requireActiveUser } from '../auth/auth.middleware.js';

import { validate } from '../../common/middlewares/validate.js';
import { BadRequestError } from '../../common/errors/AppError.js';
import { limiter } from '../../common/middlewares/rateLimit.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    fileFilter: (req, file, cb) => {
        const ok = /^(image|video)\//.test(file.mimetype);
        cb(ok ? null : new BadRequestError('invalidFileType'), ok);
    },
});


const router = new Router();

router.use(auth, requireActiveUser);

router.post('/', limiter(20), upload.single('file'), filesController.upload);
router.delete('/:id', limiter(20), validate(idParam), filesController.delete);

export default router;