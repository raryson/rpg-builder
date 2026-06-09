import { CharacterService } from '../../../../../services/CharacterService';
import { errorResponse, ok } from '../../../http';

const characterService = new CharacterService();

type Params = Promise<{ characterId: string }>;

export async function GET(request: Request, context: { params: Params }) {
  try {
    const { characterId } = await context.params;
    const url = new URL(request.url);
    const fromVersionId = url.searchParams.get('fromVersionId');
    const toVersionId = url.searchParams.get('toVersionId');

    if (!fromVersionId || !toVersionId) {
      return errorResponse(new Error('fromVersionId and toVersionId are required.'), 422);
    }

    const diff = await characterService.diffVersions(characterId, fromVersionId, toVersionId);

    return ok({ diff });
  } catch (error) {
    return errorResponse(error);
  }
}
