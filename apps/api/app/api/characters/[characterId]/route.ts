import { CharacterService } from '../../../../services/CharacterService';
import { errorResponse, ok } from '../../http';

const characterService = new CharacterService();

type Params = Promise<{ characterId: string }>;

export async function GET(_request: Request, context: { params: Params }) {
  try {
    const { characterId } = await context.params;
    const character = await characterService.get(characterId);

    if (!character) {
      return errorResponse(new Error('Character not found.'), 404);
    }

    return ok({ character });
  } catch (error) {
    return errorResponse(error);
  }
}
