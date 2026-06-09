import type { GameSystemEngine } from './engines/GameSystemEngine';
import { StarWarsSagaEngine } from './engines/StarWarsSagaEngine';

const engines = new Map<string, GameSystemEngine>([
  ['star-wars-saga', new StarWarsSagaEngine()],
]);

export function getGameSystemEngine(slug: string) {
  const engine = engines.get(slug);

  if (!engine) {
    throw new Error(`Game system engine not found for slug: ${slug}`);
  }

  return engine;
}

export function listGameSystemEngines() {
  return Array.from(engines.values());
}
