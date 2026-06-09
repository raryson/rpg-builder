import { CharacterService } from '../../../../../../services/CharacterService';
import { errorResponse, getOwnerId, ok, readJson } from '../../../../http';

const characterService = new CharacterService();

type Params = Promise<{
  characterId: string;
  versionId: string;
}>;

type RestoreBody = {
  publish?: boolean;
};

export async function POST(request: Request, context: { params: Params }) {
  try {
    const { characterId, versionId } = await context.params;
    const body = await readJson<RestoreBody>(request);
    const version = await characterService.restoreVersion(
      characterId,
      versionId,
      getOwnerId(request),
      body.publish ?? false,
    );

    return ok({ version });
  } catch (error) {
    return errorResponse(error);
  }
}
