import { getGameSystemEngine } from '../game-systems/engine-registry';

export class CharacterValidationService {
  validate(gameSystemSlug: string, snapshot: unknown) {
    const engine = getGameSystemEngine(gameSystemSlug);
    return engine.validateSheet(snapshot);
  }

  validatePrerequisites(gameSystemSlug: string, snapshot: unknown) {
    const engine = getGameSystemEngine(gameSystemSlug);
    return engine.validatePrerequisites(snapshot);
  }

  validateProgression(gameSystemSlug: string, previousSnapshot: unknown | null, nextSnapshot: unknown) {
    const engine = getGameSystemEngine(gameSystemSlug);
    return engine.validateProgression(previousSnapshot, nextSnapshot);
  }
}
