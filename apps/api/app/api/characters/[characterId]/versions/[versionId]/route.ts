import { CharacterService } from '../../../../../../services/CharacterService';
import { errorResponse, ok } from '../../../../http';

const characterService = new CharacterService();

type Params = Promise<{
  characterId: string;
  versionId: string;
}>;

export async function GET(_request: Request, context: { params: Params }) {
  try {
    const { characterId, versionId } = await context.params;
    const version = await characterService.getVersion(characterId, versionId);

    if (!version) {
      return errorResponse(new Error('Character version not found.'), 404);
    }

    return ok({ version });
  } catch (error) {
    return errorResponse(error);
  }
}
