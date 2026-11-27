import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "./localization.config.js";

export const resolveLocale = (req, res, next) => {
    req.locale = req.acceptsLanguages(...SUPPORTED_LOCALES) || DEFAULT_LOCALE;
    res.vary('Accept-Language');
    next();
};