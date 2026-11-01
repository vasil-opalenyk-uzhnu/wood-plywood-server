import { model, Schema } from "mongoose";

const passwordResetsShema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        unique: true,
    },
    codeHash: {
        type: String,
    },
    attempts: {
        type: Number,
        default: 0
    },
    sentAt: {
        type: Date,
        required: true
    },
    tokenHash: {
        type: String,
        unique: true, 
        sparse: true
    },
    expiresAt: { 
        type: Date, 
        required: true
    },
});

passwordResetsShema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const passwordResets = model('password_resets', passwordResetsShema);