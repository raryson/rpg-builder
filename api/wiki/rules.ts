import { handleError, json, queryValue } from '../_shared/http';
import { listRuleEntries } from '../_shared/mongo';

export default async function handler(req: any, res: any) {
  try {
    const rules = await listRuleEntries({
      systemSlug: queryValue(req.query?.system) ?? 'star-wars-saga',
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
