import type { GameSystemDefinition } from '../../types/game-system';

export const starWarsSagaDefinition: GameSystemDefinition = {
  name: 'Star Wars RPG - Saga Edition',
  slug: 'star-wars-saga',
  version: '1.0',
  description: 'Ficha estruturada para personagens de Star Wars RPG - Saga Edition.',
  status: 'active',
  metadata: {
    publisher: 'Wizards of the Coast',
    engineClass: 'StarWarsSagaEngine',
  },
  supportedFields: [
    { key: 'identity', label: 'Identidade', type: 'object', required: true },
    { key: 'species', label: 'Especie', type: 'object', required: true },
    { key: 'classes.levels', label: 'Classes e niveis', type: 'array', required: true },
    { key: 'abilities', label: 'Atributos', type: 'object', required: true },
    { key: 'combat', label: 'Combate', type: 'object', required: true },
    { key: 'skills', label: 'Pericias', type: 'array', required: true },
    { key: 'feats', label: 'Aptidoes', type: 'array' },
    { key: 'talents', label: 'Talentos', type: 'array' },
    { key: 'force', label: 'Forca', type: 'object' },
    { key: 'equipment', label: 'Equipamentos', type: 'array' },
    { key: 'vehicles', label: 'Veiculos', type: 'object' },
    { key: 'droid', label: 'Droides', type: 'object' },
    { key: 'progressionLog', label: 'Historico de progressao', type: 'array' },
    { key: 'levelUpChoices', label: 'Escolhas de evolucao', type: 'array' },
    { key: 'xpHistory', label: 'Historico de XP', type: 'array' },
  ],
};
