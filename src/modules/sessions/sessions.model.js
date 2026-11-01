import { Schema, model } from "mongoose";

const sessionsSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    deviceId: {
        type: String,
        required: true
    },
    refreshHash: {
        type: String,
        required: true,
        unique: true,
    },
    userAgent: String,
    ip: String,
    expiresAt: {
        type: Date,
        required: true,
    }
}, { timestamps: true });

sessionsSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
sessionsSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const sessions = model('sessions', sessionsSchema);