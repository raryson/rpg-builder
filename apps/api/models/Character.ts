import { model, models, Schema, Types, type InferSchemaType } from 'mongoose';

const CharacterSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    campaignId: { type: String, default: null, index: true },
    gameSystemId: { type: Schema.Types.ObjectId, ref: 'GameSystem', required: true, index: true },
    name: { type: String, required: true, trim: true },
    currentVersionId: { type: Schema.Types.ObjectId, ref: 'CharacterVersion', default: null },
    draftVersionId: { type: Schema.Types.ObjectId, ref: 'CharacterVersion', default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

CharacterSchema.index({ ownerId: 1, archivedAt: 1, updatedAt: -1 });

export type CharacterDocument = InferSchemaType<typeof CharacterSchema> & {
  _id: Types.ObjectId;
};

export const CharacterModel = models.Character || model('Character', CharacterSchema);
