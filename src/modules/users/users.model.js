import { model, Schema } from 'mongoose';

import { UsersRoles } from './users.roles.js';
import { UsersStatus } from './users.status.js';

import { AuthProviders } from '../auth/auth.providers.js';

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
    },
    provider: {
        type: String,
        enum: Object.values(AuthProviders),
        required: true,
    },
    socialId: {
        type: String,
        unique: true,
        sparse: true,
    },
    firstName: {
        type: String,
        required: function () { return this.provider === AuthProviders.email; },
    },
    lastName: {
        type: String,
        required: function () { return this.provider === AuthProviders.email; },
    },
    profilePicture: {
        type: Schema.Types.ObjectId,
        ref: 'files',
        default: null
    },
    role: {
        type: String,
        enum: Object.values(UsersRoles),
        default: UsersRoles.user
    },
    status: {
        type: String,
        enum: Object.values(UsersStatus),
        default: UsersStatus.inactive
    }
});

export const users = model('users', userSchema);
