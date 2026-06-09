import { model, models, Schema, type InferSchemaType } from 'mongoose';
import type { GameSystemStatus } from '../types/game-system';

const SupportedFieldSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'object', 'array'],
      required: true,
    },
    required: { type: Boolean, default: false },
  },
  { _id: false },
);

const GameSystemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    version: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'beta', 'deprecated'] satisfies GameSystemStatus[],
      default: 'beta',
      index: true,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    supportedFields: { type: [SupportedFieldSchema], default: [] },
  },
  { timestamps: true },
);

export type GameSystemDocument = InferSchemaType<typeof GameSystemSchema>;

export const GameSystemModel =
  models.GameSystem || model('GameSystem', GameSystemSchema);
