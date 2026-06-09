import { model, models, Schema, Types, type InferSchemaType } from 'mongoose';

export type CharacterVersionStatus = 'draft' | 'published' | 'archived';

const CharacterVersionSchema = new Schema(
  {
    characterId: { type: Schema.Types.ObjectId, ref: 'Character', required: true, index: true },
    gameSystemId: { type: Schema.Types.ObjectId, ref: 'GameSystem', required: true, index: true },
    versionNumber: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'] satisfies CharacterVersionStatus[],
      required: true,
      index: true,
    },
    snapshot: { type: Schema.Types.Mixed, required: true },
    changeSummary: { type: String, default: '' },
    previousVersionId: { type: Schema.Types.ObjectId, ref: 'CharacterVersion', default: null },
    createdBy: { type: String, required: true, index: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

CharacterVersionSchema.index({ characterId: 1, versionNumber: 1, status: 1 });

export type CharacterVersionDocument = InferSchemaType<typeof CharacterVersionSchema> & {
  _id: Types.ObjectId;
};

export const CharacterVersionModel =
  models.CharacterVersion || model('CharacterVersion', CharacterVersionSchema);
