import { Schema, model } from "mongoose"

import { AccountTokensPurposes } from "./account-tokens.purposes.js";

const accountTokensSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    purpose: {
        type: String,
        required: true,
        enum: Object.values(AccountTokensPurposes)
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
})

accountTokensSchema.index({ userId: 1, purpose: 1 }, { unique: true });
accountTokensSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const accountTokens = model('account_tokens', accountTokensSchema);