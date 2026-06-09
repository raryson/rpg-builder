import { requireOwnerId } from '../_shared/auth';
import { handleError, json, methodNotAllowed, queryValue, readBody } from '../_shared/http';
import { archiveWebSheet, saveWebSheet } from '../_shared/mongo';

type SaveWebSheetBody = {
  sheet?: {
    characterName?: string;
    [key: string]: unknown;
  };
};

export default async function handler(req: any, res: any) {
  try {
    const ownerId = requireOwnerId(req);
    const sheetId = queryValue(req.query?.sheetId);

    if (!sheetId) {
      json(res, 422, { error: 'sheetId is required.' });
      return;
    }

    if (req.method === 'PUT') {
      const body = await readBody<SaveWebSheetBody>(req);

      if (!body.sheet) {
        json(res, 422, { error: 'sheet is required.' });
        return;
      }

      const sheet = await saveWebSheet({
        ownerId,
        sheetId,
        name: body.sheet.characterName || 'Novo personagem',
        data: {
          ...body.sheet,
          id: sheetId,
        },
      });

      json(res, 200, { sheet });
      return;
    }

    if (req.method === 'DELETE') {
      await archiveWebSheet(ownerId, sheetId);
      json(res, 200, { deleted: true });
      return;
    }

    methodNotAllowed(res);
  } catch (error) {
    handleError(res, error);
  }
}
