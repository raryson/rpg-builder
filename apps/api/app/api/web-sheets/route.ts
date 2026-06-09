import { WebSheetService } from '../../../services/WebSheetService';
import { errorResponse, getOwnerId, ok, readJson } from '../http';

const webSheetService = new WebSheetService();

type SaveWebSheetBody = {
  sheet?: {
    id?: string;
    characterName?: string;
    [key: string]: unknown;
  };
};

export async function GET(request: Request) {
  try {
    const sheets = await webSheetService.list(getOwnerId(request));
    return ok({ sheets });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<SaveWebSheetBody>(request);

    if (!body.sheet?.id) {
      return errorResponse(new Error('sheet.id is required.'), 422);
    }

    const sheet = await webSheetService.save({
      ownerId: getOwnerId(request),
      sheetId: body.sheet.id,
      name: body.sheet.characterName || 'Novo personagem',
      data: body.sheet,
    });

    return ok({ sheet }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
