import { RuleEntryService } from '../../../../../services/RuleEntryService';
import { errorResponse, ok } from '../../../http';

const ruleEntryService = new RuleEntryService();

type Params = Promise<{ slug: string }>;

export async function GET(request: Request, context: { params: Params }) {
  try {
    const { slug } = await context.params;
    const url = new URL(request.url);
    const result = await ruleEntryService.getWithRelated(url.searchParams.get('system') ?? 'star-wars-saga', slug);

    if (!result) {
      return errorResponse(new Error('Regra não encontrada.'), 404);
    }

    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
