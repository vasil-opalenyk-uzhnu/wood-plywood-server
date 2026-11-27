import { Schema, model } from "mongoose";

import { localizedString } from '../localization/localization.schema.js';

const categorySchema = new Schema({
    title: localizedString({ required: true }),
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        default: null,
        index: true,
    },
}, { timestamps: true });

export const categories = model('categories', categorySchema);