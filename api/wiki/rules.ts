import { handleError, json, queryValue } from '../_shared/http';
import { getRuleEntryWithRelated, listRuleEntries } from '../_shared/mongo';

export default async function handler(req: any, res: any) {
  try {
    const slug = queryValue(req.query?.slug);
    const systemSlug = queryValue(req.query?.system) ?? 'star-wars-saga';

    if (slug) {
      const result = await getRuleEntryWithRelated(systemSlug, slug);

      if (!result) {
        json(res, 404, { error: 'Regra nÃ£o encontrada.' });
        return;
      }

      json(res, 200, result);
      return;
    }

    const rules = await listRuleEntries({
      systemSlug,
      type: queryValue(req.query?.type),
      category: queryValue(req.query?.category),
      query: queryValue(req.query?.q),
      limit: Number(queryValue(req.query?.limit) ?? 80),
    });

    json(res, 200, { rules });
  } catch (error) {
    handleError(res, error);
  }
}
