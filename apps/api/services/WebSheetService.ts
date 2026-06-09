import { connectToDatabase } from '../lib/mongodb';
import { WebSheetModel } from '../models/WebSheet';

type SaveWebSheetInput = {
  ownerId: string;
  sheetId: string;
  name: string;
  data: unknown;
};

export class WebSheetService {
  async list(ownerId: string) {
    await connectToDatabase();

    const sheets = await WebSheetModel.find({
      ownerId,
      archivedAt: null,
    }).sort({ updatedAt: -1 });

    return sheets.map((sheet) => sheet.data);
  }

  async save(input: SaveWebSheetInput) {
    await connectToDatabase();

    const sheet = await WebSheetModel.findOneAndUpdate(
      {
        ownerId: input.ownerId,
        sheetId: input.sheetId,
      },
      {
        $set: {
          name: input.name,
          data: input.data,
          archivedAt: null,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return sheet.data;
  }

  async archive(ownerId: string, sheetId: string) {
    await connectToDatabase();

    await WebSheetModel.findOneAndUpdate(
      {
        ownerId,
        sheetId,
      },
      {
        $set: {
          archivedAt: new Date(),
        },
      },
    );
  }
}
