import { CharacterService } from '../../../../../services/CharacterService';
import { errorResponse, ok, readJson } from '../../../http';

const characterService = new CharacterService();

type Params = Promise<{ characterId: string }>;

type UpdateDraftBody = {
  snapshot?: unknown;
  changeSummary?: string;
};

export async function PATCH(request: Request, context: { params: Params }) {
  try {
    const { characterId } = await context.params;
    const body = await readJson<UpdateDraftBody>(request);

    if (!body.snapshot) {
      return errorResponse(new Error('snapshot is required.'), 422);
    }

    const draft = await characterService.updateDraft({
      characterId,
      snapshot: body.snapshot,
      changeSummary: body.changeSummary,
    });

    return ok({ draft });
  } catch (error) {
    return errorResponse(error);
  }
}
