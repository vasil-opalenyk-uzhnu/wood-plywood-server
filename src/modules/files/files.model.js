import { model, Schema } from 'mongoose'

import { FilesType } from './files.type.js';
import { FilesStatus } from './files.status.js';

export const defaultExpiresAt = () => new Date(Date.now() + Number(process.env.FILES_EXPIRES_AT || 300000));

const filesSchema = new Schema({
    path: {
        type: String,
        required: true,
    },
    publicId: {
        type: String,
        unique: true,
        required: true,
    },
    type: {
        type: String,
        enum: Object.values(FilesType),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(FilesStatus),
        default: FilesStatus.pending,
    },
    ownerId: { 
        type: Schema.Types.ObjectId, 
        ref: 'users', 
        required: true
    },
    expiresAt: {
        type: Date,
        default: defaultExpiresAt,
    },
});

export const files = model('files', filesSchema);