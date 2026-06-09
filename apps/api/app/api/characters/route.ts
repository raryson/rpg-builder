import { CharacterService } from '../../../services/CharacterService';
import { errorResponse, getOwnerId, ok, readJson } from '../http';

const characterService = new CharacterService();

type CreateCharacterBody = {
  campaignId?: string | null;
  gameSystemSlug?: string;
  name?: string;
  snapshot?: unknown;
};

export async function GET(request: Request) {
  try {
    const characters = await characterService.list(getOwnerId(request));
    return ok({ characters });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<CreateCharacterBody>(request);
    const result = await characterService.create({
      ownerId: getOwnerId(request),
      campaignId: body.campaignId,
      gameSystemSlug: body.gameSystemSlug ?? 'star-wars-saga',
      name: body.name ?? 'Novo personagem',
      snapshot: body.snapshot,
    });

    return ok(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
