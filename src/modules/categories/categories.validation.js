import mongoose from 'mongoose';
import { body, param } from 'express-validator';

import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../localization/localization.config.js';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const otherLocales = SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

const titleRules = ({ partial = false } = {}) => {
    const title = partial ? body('title').optional() : body('title');
    const defaultTitle = partial ? body(`title.${DEFAULT_LOCALE}`).if(body('title').exists()) : body(`title.${DEFAULT_LOCALE}`);

    return [
        title.isObject().withMessage('invalidTitle'),
        defaultTitle
            .isString().withMessage('invalidTitle')
            .bail()
            .trim()
            .isLength({ min: 1, max: 100 }).withMessage('invalidTitle'),
        ...otherLocales.map((locale) => body(`title.${locale}`)
            .optional({ values: 'falsy' })
            .isString().withMessage('invalidTitle')
            .bail()
            .trim()
            .isLength({ max: 100 }).withMessage('invalidTitle')),
    ];
};

const slugRule = ({ partial = false } = {}) => {
    const chain = partial ? body('slug').optional() : body('slug');

    return chain
        .isString().withMessage('invalidSlug')
        .bail()
        .trim()
        .toLowerCase()
        .isLength({ min: 1, max: 100 }).withMessage('invalidSlug')
        .matches(SLUG_REGEX).withMessage('invalidSlug');
};

const parentIdRule = () => body('parentId')
    .optional({ values: 'undefined' })
    .custom((value) => value === null || (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)))
    .withMessage('invalidParentId');

export const createCategoryRules = [
    ...titleRules(),
    slugRule(),
    parentIdRule(),
];

export const updateCategoryRules = [
    ...titleRules({ partial: true }),
    slugRule({ partial: true }),
    parentIdRule(),
];

export const idParam = [
    param('id').isMongoId().withMessage('invalidId'),
];

export const slugParam = [
    param('slug').trim().toLowerCase().matches(SLUG_REGEX).withMessage('invalidSlug'),
];
