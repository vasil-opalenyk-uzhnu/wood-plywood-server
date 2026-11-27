import { localizationService } from '../../modules/localization/localization.service.js';
import { SUPPORTED_LOCALES } from '../../modules/localization/localization.config.js';

const baseResponse = (category) => ({
    id: String(category._id ?? category.id),
    slug: category.slug,
    parentId: category.parentId ? String(category.parentId) : null,
});

export const toCategoryResponse = (category, locale) => {
    if (!category) return null;

    return {
        ...baseResponse(category),
        title: localizationService.pick(category.title, locale),
        ...(category.children && {
            children: category.children.map(child => toCategoryResponse(child, locale)),
        }),
    };
}

export const toCategoryAdminResponse = (category) => {
    if(!category) return null;

    return {
        ...baseResponse(category),
        title: Object.fromEntries(
            SUPPORTED_LOCALES.map(locale => [locale, category.title?.[locale] ?? null])
        ),
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        ...(category.children && {
            children: category.children.map(toCategoryAdminResponse),
        }),
    };
};