import { CharacterService } from '../../../../../services/CharacterService';
import { errorResponse, ok } from '../../../http';

const characterService = new CharacterService();

type Params = Promise<{ characterId: string }>;

export async function GET(_request: Request, context: { params: Params }) {
  try {
    const { characterId } = await context.params;
    const versions = await characterService.listVersions(characterId);

    return ok({ versions });
  } catch (error) {
    return errorResponse(error);
  }
}
