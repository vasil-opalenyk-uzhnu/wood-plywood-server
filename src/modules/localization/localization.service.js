import { DEFAULT_LOCALE } from "./localization.config.js";

class LocalizationService {
    pick(value, locale = DEFAULT_LOCALE) {
        if(!value) return null;
        return value[locale] || value[DEFAULT_LOCALE] || null;
    }
}

export const localizationService = new LocalizationService();