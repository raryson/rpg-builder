import { CharacterService } from '../../../../../services/CharacterService';
import { errorResponse, ok, readJson } from '../../../http';

const characterService = new CharacterService();

type Params = Promise<{ characterId: string }>;

type PublishBody = {
  changeSummary?: string;
};

export async function POST(request: Request, context: { params: Params }) {
  try {
    const { characterId } = await context.params;
    const body = await readJson<PublishBody>(request);
    const version = await characterService.publish(characterId, body.changeSummary);

    return ok({ version });
  } catch (error) {
    return errorResponse(error);
  }
}
