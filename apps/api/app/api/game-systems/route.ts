import { GameSystemService } from '../../../services/GameSystemService';
import { errorResponse, ok } from '../http';

const gameSystemService = new GameSystemService();

export async function GET() {
  try {
    await gameSystemService.ensureStarWarsSagaSystem();
    const gameSystems = await gameSystemService.list();
    return ok({ gameSystems });
  } catch (error) {
    return errorResponse(error);
  }
}
