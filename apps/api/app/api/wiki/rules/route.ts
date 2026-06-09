import { RuleEntryService } from '../../../../services/RuleEntryService';
import { errorResponse, ok } from '../../http';

const ruleEntryService = new RuleEntryService();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');

    if (slug) {
      const result = await ruleEntryService.getWithRelated(url.searchParams.get('system') ?? 'star-wars-saga', slug);

      if (!result) {
        return errorResponse(new Error('Regra nÃ£o encontrada.'), 404);
      }

      return ok(result);
    }

    const rules = await ruleEntryService.list({
      systemSlug: url.searchParams.get('system') ?? 'star-wars-saga',
      type: url.searchParams.get('type') ?? undefined,
      category: url.searchParams.get('category') ?? undefined,
      query: url.searchParams.get('q') ?? undefined,
      limit: Number(url.searchParams.get('limit') ?? 80),
    });

    return ok({ rules });
  } catch (error) {
    return errorResponse(error);
  }
}
