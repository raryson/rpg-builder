import { StarWarsSagaCatalogService } from '../../../../services/StarWarsSagaCatalogService';
import { errorResponse, ok } from '../../http';

const catalogService = new StarWarsSagaCatalogService();

export async function GET() {
  try {
    const catalogs = await catalogService.listCatalogs();
    return ok({ catalogs });
  } catch (error) {
    return errorResponse(error);
  }
}
