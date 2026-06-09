import { model, models, Schema, type InferSchemaType } from 'mongoose';

const RuleEntrySchema = new Schema(
  {
    systemSlug: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    category: { type: String, default: '', index: true },
    summary: { type: String, default: '' },
    content: { type: String, default: '' },
    stats: { type: Schema.Types.Mixed, default: {} },
    tags: { type: [String], default: [], index: true },
    source: { type: String, default: '' },
    visibility: { type: String, enum: ['public', 'private'], default: 'public', index: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true },
  },
  { timestamps: true },
);

RuleEntrySchema.index({ systemSlug: 1, type: 1, slug: 1 }, { unique: true });
RuleEntrySchema.index({ systemSlug: 1, visibility: 1, status: 1, type: 1, category: 1, name: 1 });
RuleEntrySchema.index({ name: 'text', summary: 'text', content: 'text', tags: 'text' });

export type RuleEntryDocument = InferSchemaType<typeof RuleEntrySchema>;

export const RuleEntryModel = models.RuleEntry || model('RuleEntry', RuleEntrySchema);
