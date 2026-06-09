import { handleError, json, queryValue } from '../../_shared/http';
import { getRuleEntryWithRelated } from '../../_shared/mongo';

export default async function handler(req: any, res: any) {
  try {
    const slug = queryValue(req.query?.slug);

    if (!slug) {
      json(res, 422, { error: 'slug is required.' });
      return;
    }

    const result = await getRuleEntryWithRelated(queryValue(req.query?.system) ?? 'star-wars-saga', slug);

    if (!result) {
      json(res, 404, { error: 'Regra não encontrada.' });
      return;
    }

    json(res, 200, result);
  } catch (error) {
    handleError(res, error);
  }
}
