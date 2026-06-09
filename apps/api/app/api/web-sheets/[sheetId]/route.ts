import { WebSheetService } from '../../../../services/WebSheetService';
import { errorResponse, getOwnerId, ok, readJson } from '../../http';

const webSheetService = new WebSheetService();

type Params = Promise<{ sheetId: string }>;

type SaveWebSheetBody = {
  sheet?: {
    id?: string;
    characterName?: string;
    [key: string]: unknown;
  };
};

export async function PUT(request: Request, context: { params: Params }) {
  try {
    const { sheetId } = await context.params;
    const body = await readJson<SaveWebSheetBody>(request);

    if (!body.sheet) {
      return errorResponse(new Error('sheet is required.'), 422);
    }

    const sheet = await webSheetService.save({
      ownerId: getOwnerId(request),
      sheetId,
      name: body.sheet.characterName || 'Novo personagem',
      data: {
        ...body.sheet,
        id: sheetId,
      },
    });

    return ok({ sheet });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: { params: Params }) {
  try {
    const { sheetId } = await context.params;
    await webSheetService.archive(getOwnerId(request), sheetId);
    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
