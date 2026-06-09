import { requireOwnerId } from '../_shared/auth';
import { handleError, json, methodNotAllowed, readBody } from '../_shared/http';
import { listWebSheets, saveWebSheet } from '../_shared/mongo';

type SaveWebSheetBody = {
  sheet?: {
    id?: string;
    characterName?: string;
    [key: string]: unknown;
  };
};

export default async function handler(req: any, res: any) {
  try {
    const ownerId = requireOwnerId(req);

    if (req.method === 'GET') {
      const sheets = await listWebSheets(ownerId);
      json(res, 200, { sheets });
      return;
    }

    if (req.method === 'POST') {
      const body = await readBody<SaveWebSheetBody>(req);

      if (!body.sheet?.id) {
        json(res, 422, { error: 'sheet.id is required.' });
        return;
      }

      const sheet = await saveWebSheet({
        ownerId,
        sheetId: body.sheet.id,
        name: body.sheet.characterName || 'Novo personagem',
        data: body.sheet,
      });

      json(res, 201, { sheet });
      return;
    }

    methodNotAllowed(res);
  } catch (error) {
    handleError(res, error);
  }
}
