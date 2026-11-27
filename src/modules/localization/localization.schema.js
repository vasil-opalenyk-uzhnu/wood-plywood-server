import { Schema } from "mongoose";

import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './localization.config.js';

export const localizedString = ({ required = false, maxlength = 100 } = {}) => {
  const subSchema = new Schema(
    Object.fromEntries(
      SUPPORTED_LOCALES.map(locale => [locale, { type: String, trim: true, maxlength }])
    ),
    { _id: false }
  );

  return {
    type: subSchema,
    required,
    validate: {
      validator: (value) => value == null || Boolean(value[DEFAULT_LOCALE]),
      message: 'defaultLocaleRequired',
    },
  }
}