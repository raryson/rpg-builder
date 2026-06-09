import { getGameSystemEngine } from '../game-systems/engine-registry';

export class CharacterCalculationService {
  calculateDerivedFields(gameSystemSlug: string, snapshot: unknown) {
    const engine = getGameSystemEngine(gameSystemSlug);
    return engine.calculateDerivedFields(snapshot);
  }

  summarize(gameSystemSlug: string, snapshot: unknown) {
    const engine = getGameSystemEngine(gameSystemSlug);
    return engine.generateSummary(snapshot);
  }

  prepareForExport(gameSystemSlug: string, snapshot: unknown) {
    const engine = getGameSystemEngine(gameSystemSlug);
    return engine.prepareForExport(snapshot);
  }
}
