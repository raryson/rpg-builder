import { model, models, Schema, type InferSchemaType } from 'mongoose';

const WebUserSchema = new Schema(
  {
    provider: { type: String, required: true, default: 'google', index: true },
    providerId: { type: String, required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    emailVerified: { type: Boolean, required: true, default: false },
    name: { type: String, required: true, trim: true },
    picture: { type: String, default: '' },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

WebUserSchema.index({ provider: 1, providerId: 1 }, { unique: true });

export type WebUserDocument = InferSchemaType<typeof WebUserSchema>;

export const WebUserModel = models.WebUser || model('WebUser', WebUserSchema);
