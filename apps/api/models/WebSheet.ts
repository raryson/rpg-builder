import { model, models, Schema, type InferSchemaType } from 'mongoose';

const WebSheetSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    sheetId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    data: { type: Schema.Types.Mixed, required: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

WebSheetSchema.index({ ownerId: 1, sheetId: 1 }, { unique: true });
WebSheetSchema.index({ ownerId: 1, archivedAt: 1, updatedAt: -1 });

export type WebSheetDocument = InferSchemaType<typeof WebSheetSchema>;

export const WebSheetModel = models.WebSheet || model('WebSheet', WebSheetSchema);
