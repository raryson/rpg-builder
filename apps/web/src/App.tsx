import {
  BadgePlus,
  BookOpen,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Copy,
  Dice5,
  Download,
  FilePlus2,
  LogOut,
  Package,
  Save,
  Search,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  UserRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  sagaDroidDetailsCatalog,
  sagaEquipmentDetailsCatalog,
  sagaFeatDetailsCatalog,
  sagaForceTalentDetailsCatalog,
  sagaTalentDetailsCatalog,
  sagaVehicleDetailsCatalog,
} from './starWarsSagaCatalogData';

type SheetTab =
  | 'summary'
  | 'identity'
  | 'species'
  | 'abilities'
  | 'combat'
  | 'skills'
  | 'feats'
  | 'talents'
  | 'force'
  | 'equipment'
  | 'vehicles'
  | 'droids'
  | 'notes'
  | 'history'
  | 'versions';

type AbilityKey = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

type CatalogItem = {
  name: string;
  slug: string;
  meta?: string;
};

type FeatCatalogItem = CatalogItem & {
  prerequisites: string;
  benefit: string;
  normal?: string;
  special?: string;
  summary?: string;
  details?: string;
  category?: string;
  extra?: string;
};

type DetailCatalogItem = CatalogItem & {
  summary: string;
  details: string;
  prerequisites?: string;
  category?: string;
  classRestriction?: string[];
  extra?: string;
};

type AuthUser = {
  email: string;
  name: string;
  picture: string;
};

type WikiRule = {
  id: string;
  systemSlug: string;
  type: string;
  name: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  stats: Record<string, unknown>;
  tags: string[];
  source: string;
  imageUrl?: string;
  imageSourceUrl?: string;
  imageAttribution?: string;
  imageProvider?: string;
  imageUpdatedAt?: string | null;
};

type WikiSystem = {
  slug: string;
  name: string;
  shortName: string;
};

type RuleChip = {
  label: string;
  value: string;
  tone: 'damage' | 'roll' | 'action' | 'range' | 'cost';
};

type DefenseKey = 'reflex' | 'fortitude' | 'will';

type SpeciesCatalogItem = CatalogItem & {
  size: string;
  speed: number;
  abilityModifiers: Record<AbilityKey, number>;
  defenseBonuses: Record<DefenseKey, number>;
  skillBonuses: Record<string, number>;
  traits: string[];
  description: string;
};

type ClassCatalogItem = CatalogItem & {
  startingHitPoints: number;
  hitDie: string;
  baseAttackProgression: 'full' | 'three-quarters';
  defenseBonuses: Record<DefenseKey, number>;
  startingFeats: string[];
  description: string;
  role: string;
  keyAttributes: AbilityKey[];
  trainedSkillBase: number;
  talentTrees: string[];
  bonusFeats: string[];
  credits: string;
};

type SkillEntry = {
  skillSlug: string;
  trained: boolean;
  focused: boolean;
  misc: number;
};

type ClassLevelEntry = {
  classSlug: string;
  level: number;
};

type LevelHistoryEntry = {
  id: string;
  level: number;
  classSlug: string;
  hitPointGain: number;
  talentSlug: string;
  featSlug: string;
  abilityBoosts: AbilityKey[];
  notes: string;
  createdAt: string;
};

type SheetVersion = {
  id: string;
  versionNumber: number;
  level: number;
  summary: string;
  createdAt: string;
  snapshot: Record<string, unknown>;
};

type CharacterSheet = {
  id: string;
  characterName: string;
  playerName: string;
  campaignName: string;
  era: 'rise-of-the-empire' | 'rebellion-era' | 'new-jedi-order' | 'custom';
  destiny: string;
  gender: string;
  age: string;
  height: string;
  weight: string;
  eyes: string;
  hair: string;
  skin: string;
  homeworld: string;
  languages: string;
  background: string;
  personality: string;
  appearance: string;
  portraitUrl: string;
  portraitBlobPath: string;
  speciesSlug: string;
  classSlug: string;
  classLevels: ClassLevelEntry[];
  totalLevel: number;
  heroicLevel: number;
  prestigeLevel: number;
  abilities: Record<AbilityKey, number>;
  hitPointsCurrent: number;
  hitPointsMaximum: number;
  hitPointsTemporary: number;
  damageTaken: number;
  conditionStep: number;
  speed: number;
  destinyPoints: number;
  forcePoints: number;
  darkSideScore: number;
  skills: SkillEntry[];
  feats: string[];
  talents: string[];
  forceSensitivity: boolean;
  forcePowers: string[];
  forceTechniques: string[];
  forceSecrets: string[];
  forceTradition: string;
  inventory: string[];
  equippedWeapons: string[];
  equippedArmor: string;
  credits: number;
  vehicles: string[];
  assignedVehicle: string;
  droidDegree: string;
  droidSystems: string[];
  notes: string;
  progressionLog: string;
  levelHistory: LevelHistoryEntry[];
  sheetVersions: SheetVersion[];
  versionNote: string;
  isFinalized: boolean;
  updatedAt: string;
};

type SummaryListItem = {
  label: string;
  slug?: string;
  meta?: string;
};

const STORAGE_KEY = 'rpg-builder-star-wars-saga-sheets';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const SITE_NAME = 'RPG Builder';
const DEFAULT_DESCRIPTION = 'Crie fichas e consulte a wiki pública de Star Wars Saga Edition.';
const wikiSystems: WikiSystem[] = [
  {
    slug: 'star-wars-saga',
    name: 'Star Wars Saga Edition',
    shortName: 'Star Wars Saga',
  },
];

const sheetTabs: Array<{ id: SheetTab; label: string }> = [
  { id: 'identity', label: 'Identidade' },
  { id: 'species', label: 'Espécie, Classes e Níveis' },
  { id: 'abilities', label: 'Atributos' },
  { id: 'combat', label: 'Combate' },
  { id: 'skills', label: 'Perícias' },
  { id: 'feats', label: 'Aptidões' },
  { id: 'talents', label: 'Talentos' },
  { id: 'force', label: 'Força' },
  { id: 'equipment', label: 'Equipamentos' },
  { id: 'vehicles', label: 'Veículos' },
  { id: 'droids', label: 'Dróides' },
  { id: 'notes', label: 'Anotações' },
  { id: 'history', label: 'Histórico' },
  { id: 'versions', label: 'Versões' },
  { id: 'summary', label: 'Resumo final' },
];

const eras = [
  ['rise-of-the-empire', 'Ascensão do Império'],
  ['rebellion-era', 'Era da Rebelião'],
  ['new-jedi-order', 'Nova Ordem Jedi'],
  ['custom', 'Custom'],
] as const;

const emptyAbilityMods: Record<AbilityKey, number> = {
  strength: 0,
  dexterity: 0,
  constitution: 0,
  intelligence: 0,
  wisdom: 0,
  charisma: 0,
};

const emptyDefenseBonuses: Record<DefenseKey, number> = { reflex: 0, fortitude: 0, will: 0 };

const speciesCatalog: SpeciesCatalogItem[] = [
  species('Humano', {}, {}, {}, 6, 'Médio', ['Perícia treinada extra no 1º nível', 'Aptidão extra no 1º nível'], 'Sem ajuste de habilidade; ganha uma perícia treinada extra e uma aptidão extra no 1º nível.'),
  species('Bothan', { dexterity: 2, constitution: -2 }, { will: 2 }, {}, 6, 'Médio', ['Vontade de Ferro', 'Foco em Obter Informações se treinado'], '+2 Des, -2 Con; +2 espécie em Vontade.'),
  species('Cereano', { dexterity: -2, intelligence: 2, wisdom: 2 }, {}, {}, 6, 'Médio', ['Refaz Iniciativa', 'Foco em Iniciativa se treinado'], '+2 Int, +2 Sab, -2 Des; refaz testes de Iniciativa.'),
  species('Devaroniano', { dexterity: 2, wisdom: -2, charisma: -2 }, {}, {}, 6, 'Médio', ['Padrão masculino aplicado', 'Fêmea: +2 Sab, -2 Des', 'Curiosidade Natural'], '+2 Des, -2 Sab, -2 Car no padrão masculino; ajuste feminino deve ser editado manualmente.'),
  species('Duros', { dexterity: 2, constitution: -2, intelligence: 2 }, {}, {}, 6, 'Médio', ['Refaz Pilotar'], '+2 Des, +2 Int, -2 Con; piloto experiente.'),
  species('Ewok', { strength: -2, dexterity: 2 }, { reflex: 1 }, { furtividade: 5 }, 4, 'Pequeno', ['Pequeno', 'Primitivo', 'Olfato', 'Refaz Furtividade'], '+2 Des, -2 For; tamanho Pequeno: +1 Reflexos e +5 Furtividade; deslocamento 4.'),
  species('Gamorreano', { strength: 2, dexterity: -2, intelligence: -2 }, { fortitude: 2 }, {}, 6, 'Médio', ['Primitivo', 'Grande Fortitude', 'Limite de Dano Aprimorado'], '+2 For, -2 Des, -2 Int; +2 espécie em Fortitude.'),
  species('Gungan', { dexterity: 2, intelligence: -2, charisma: -2 }, {}, {}, 6, 'Médio', ['Nado 4', 'Nadador Experiente', 'Prender respiração'], '+2 Des, -2 Int, -2 Car; deslocamento 6 e nado 4.'),
  species('Ithoriano', { dexterity: -2, wisdom: 2, charisma: 2 }, { will: 2 }, {}, 6, 'Médio', ['Vontade de Ferro', 'Urrar', 'Refaz Sobrevivência'], '+2 Sab, +2 Car, -2 Des; +2 espécie em Vontade.'),
  species('Kel Dor', { dexterity: 2, constitution: -2, wisdom: 2 }, {}, {}, 6, 'Médio', ['Senso Apurado da Força', 'Visão na Penumbra', 'Equipamento especial'], '+2 Des, +2 Sab, -2 Con; refaz certos usos de Usar a Força.'),
  species('Mon Calamariano', { constitution: -2, intelligence: 2, wisdom: 2 }, {}, {}, 6, 'Médio', ['Anfíbio', 'Nado 4', 'Nadador Experiente'], '+2 Int, +2 Sab, -2 Con; anfíbio e nado 4.'),
  species('Quarren', { constitution: 2, wisdom: -2, charisma: -2 }, {}, {}, 6, 'Médio', ['Aquático', 'Nado 4', 'Visão na Penumbra', 'Foco em Persuasão se treinado'], '+2 Con, -2 Sab, -2 Car; aquático e nado 4.'),
  species('Rodiano', { dexterity: 2, wisdom: -2, charisma: -2 }, {}, {}, 6, 'Médio', ['Caçador nato'], '+2 Des, -2 Sab, -2 Car.'),
  species('Sullustano', { dexterity: 2, constitution: -2 }, {}, {}, 6, 'Médio', ['Ver no Escuro', 'Escolhe 10 em Escalar', 'Refaz Percepção'], '+2 Des, -2 Con; ver no escuro e refaz Percepção.'),
  species('Trandoshano', { strength: 2, dexterity: -2 }, { reflex: 1 }, {}, 6, 'Médio', ['Ver no Escuro', 'Regeneração', 'Armadura Natural', 'Vigoroso'], '+2 For, -2 Des; armadura natural +1 Reflexos.'),
  species("Twi'lek", { wisdom: -2, charisma: 2 }, {}, {}, 6, 'Médio', ['Comunicação por lekku'], '+2 Car, -2 Sab.'),
  species('Wookiee', { strength: 4, dexterity: -2, constitution: 2, wisdom: -2, charisma: -2 }, {}, {}, 6, 'Médio', ['Recuperação Extraordinária', 'Fúria', 'Escolhe 10 em Escalar'], '+4 For, +2 Con, -2 Des, -2 Sab, -2 Car; fúria e recuperação extraordinária.'),
  species('Zabrak', {}, {}, {}, 6, 'Médio', ['Sem ajuste de habilidade'], 'Sem ajustes de habilidade na Tabela 2-1.'),
];

const heroicClassCatalog: ClassCatalogItem[] = [
  heroicClass({
    name: 'Jedi',
    startingHitPoints: 30,
    hitDie: 'd10',
    baseAttackProgression: 'full',
    defenseBonuses: { reflex: 1, fortitude: 1, will: 1 },
    startingFeats: ['Sensível à Força', 'Sabre de Luz', 'Armas simples'],
    description: '+1 Reflexos, +1 Fortitude, +1 Vontade; BBA completo; PV inicial 30 + Con. Talentos focam a Força, sentinela e combate com sabre de luz.',
    role: 'Usuário da Força / combatente disciplinado',
    keyAttributes: ['wisdom', 'charisma', 'dexterity'],
    trainedSkillBase: 2,
    talentTrees: ['Sentinela Jedi', 'Combate com Sabre de Luz'],
    bonusFeats: ['Acuidade com Arma', 'Artes Marciais I', 'Ataque Duplo', 'Ataque em Movimento', 'Ataque Poderoso', 'Ataque Rápido', 'Crítico Triplicado', 'Esquiva', 'Foco em Arma', 'Foco em Perícia', 'Poderoso na Força', 'Investida Aprimorada', 'Investida Poderosa', 'Maestria com Duas Armas I', 'Maestria com Duas Armas II', 'Maestria com Duas Armas III', 'Mobilidade', 'Reflexos em Combate', 'Saque Rápido', 'Treinamento em Perícia'],
    credits: '3d4 × 100',
  }),
  heroicClass({
    name: 'Nobre',
    startingHitPoints: 18,
    hitDie: 'd6',
    baseAttackProgression: 'three-quarters',
    defenseBonuses: { reflex: 1, fortitude: 0, will: 2 },
    startingFeats: ['Linguista', 'Pistolas', 'Armas simples'],
    description: '+1 Reflexos, +2 Vontade; BBA 3/4; PV inicial 18 + Con. Classe de liderança, influência e suporte social.',
    role: 'Líder / suporte social',
    keyAttributes: ['charisma', 'intelligence', 'wisdom'],
    trainedSkillBase: 6,
    talentTrees: ['Influência', 'Inspiração', 'Liderança'],
    bonusFeats: ['Acuidade com Arma', 'Cirurgia Cibernética', 'Especialista Cirúrgico', 'Foco em Perícia', 'Linguista', 'Treinamento em Perícia', 'Proficiência em Armaduras (Leves)', 'Proficiência em Armas', 'Proficiência em Armas Exóticas', 'Especialista Técnico'],
    credits: '5d4 × 250',
  }),
  heroicClass({
    name: 'Fora-da-Lei',
    startingHitPoints: 18,
    hitDie: 'd6',
    baseAttackProgression: 'three-quarters',
    defenseBonuses: { reflex: 2, fortitude: 0, will: 1 },
    startingFeats: ['Tiro à Queima-Roupa', 'Pistolas', 'Armas simples'],
    description: '+2 Reflexos, +1 Vontade; BBA 3/4; PV inicial 18 + Con. Usa perícias, mobilidade, sorte e ataques oportunistas.',
    role: 'Especialista / oportunista',
    keyAttributes: ['dexterity', 'intelligence', 'charisma'],
    trainedSkillBase: 6,
    talentTrees: ['Sorte', 'Precisão', 'Furtividade', 'Manipulação'],
    bonusFeats: ['Ataque Duplo', 'Ataque em Movimento', 'Combate Veicular', 'Esquiva', 'Foco em Perícia', 'Franco-atirador', 'Saque Rápido', 'Tiro Preciso', 'Tiro à Queima Roupa', 'Treinamento em Perícia'],
    credits: '4d4 × 250',
  }),
  heroicClass({
    name: 'Batedor',
    startingHitPoints: 24,
    hitDie: 'd8',
    baseAttackProgression: 'three-quarters',
    defenseBonuses: { reflex: 2, fortitude: 1, will: 0 },
    startingFeats: ['Recuperação Rápida', 'Pistolas', 'Rifles', 'Armas simples'],
    description: '+2 Reflexos, +1 Fortitude; BBA 3/4; PV inicial 24 + Con. Exploração, sobrevivência, rastreamento e reconhecimento.',
    role: 'Explorador / sobrevivente',
    keyAttributes: ['dexterity', 'wisdom', 'intelligence'],
    trainedSkillBase: 5,
    talentTrees: ['Consciência', 'Camuflagem', 'Improvisador', 'Sobrevivente'],
    bonusFeats: ['Ataque em Movimento', 'Certeiro', 'Combate Veicular', 'Esquiva', 'Foco em Perícia', 'Franco-atirador', 'Linguista', 'Mobilidade', 'Proficiência em Armaduras (Leves)', 'Proficiência em Armaduras (Médias)', 'Proficiência em Armaduras (Pesadas)', 'Proficiência em Armas', 'Tiro à Queima Roupa', 'Tiro Distante', 'Tiro Meticuloso', 'Tiro Preciso', 'Tiro Rápido', 'Treinamento em Perícia'],
    credits: '3d4 × 250',
  }),
  heroicClass({
    name: 'Soldado',
    startingHitPoints: 30,
    hitDie: 'd10',
    baseAttackProgression: 'full',
    defenseBonuses: { reflex: 1, fortitude: 2, will: 0 },
    startingFeats: ['Armas simples', 'Pistolas', 'Rifles', 'Armadura leve', 'Armadura média'],
    description: '+1 Reflexos, +2 Fortitude; BBA completo; PV inicial 30 + Con. Especialista em combate direto, armas e armaduras.',
    role: 'Combatente / defensor',
    keyAttributes: ['dexterity', 'constitution', 'strength'],
    trainedSkillBase: 3,
    talentTrees: ['Especialista em Armaduras', 'Lutador', 'Comando', 'Especialista em Armas'],
    bonusFeats: ['Artes Marciais I', 'Ataque Duplo', 'Ataque Poderoso', 'Ataque Rápido', 'Combate Veicular', 'Crítico Triplicado', 'Foco em Arma', 'Foco em Perícia', 'Proficiência Armadura Pesada', 'Proficiência Armas Exóticas', 'Proficiência Armas Pesadas', 'Recuperação Rápida', 'Saque Rápido', 'Tiro Preciso', 'Tiro Rápido', 'Tiro à Queima Roupa', 'Treinamento em Perícia', 'Vigoroso'],
    credits: '3d4 × 250',
  }),
];

type SkillCatalogItem = CatalogItem & {
  ability: AbilityKey;
  armor: boolean;
  description?: string;
};

const skillRows: Array<[string, AbilityKey, boolean, string?]> = [
  ['Acrobacia', 'dexterity', true],
  ['Conhecimento', 'intelligence', false],
  ['Conhecimento (Sabedoria Galáctica)', 'intelligence', false, 'Planetas, planeta natal, setores do espaço, história galáctica e a Força.'],
  ['Conhecimento (Ciências de Vida)', 'intelligence', false, 'Biologia, botânica, genética, arqueologia, xenobiologia, medicina e direito.'],
  ['Conhecimento (Ciências Físicas)', 'intelligence', false, 'Astronomia, astronavegação, química, matemática, física e engenharia.'],
  ['Conhecimento (Ciências Sociais)', 'intelligence', false, 'Sociologia, psicologia, filosofia, teologia e criminologia.'],
  ['Conhecimento (Táticas)', 'intelligence', false, 'Técnicas e estratégias para posicionar e manobrar forças em combate.'],
  ['Conhecimento (Tecnologia)', 'intelligence', false, 'Função e princípios dos aparelhos tecnológicos, teorias de ponta e avanços.'],
  ['Dissimulação', 'charisma', false],
  ['Escalar', 'strength', true],
  ['Furtividade', 'dexterity', true],
  ['Iniciativa', 'dexterity', false],
  ['Mecânica', 'intelligence', false],
  ['Montar', 'dexterity', true],
  ['Nadar', 'strength', true],
  ['Obter Informações', 'charisma', false],
  ['Percepção', 'wisdom', false],
  ['Persuasão', 'charisma', false],
  ['Pilotar', 'dexterity', false],
  ['Resistência', 'constitution', false],
  ['Saltar', 'strength', true],
  ['Sobrevivência', 'wisdom', false],
  ['Tratar Ferimentos', 'wisdom', false],
  ['Usar Computador', 'intelligence', false],
  ['Usar a Força', 'charisma', false],
];

const skillCatalog: SkillCatalogItem[] = skillRows.map(([name, ability, armor, description]) => ({
  ...toCatalogItem(name),
  ability,
  armor,
  description,
}));

const featCatalog: FeatCatalogItem[] = sagaFeatDetailsCatalog.map((item) => ({
  ...item,
  prerequisites: item.prerequisites || 'Nenhum',
  benefit: item.benefit || item.summary || item.details || 'Detalhes pendentes de cataloga??o.',
}));
const baseForcePowerCatalog = [
  'Estrangulamento da Força',
  'Desarmar da Força',
  'Empurrão da Força',
  'Fúria Sombria',
  'Impulso',
  'Mover Objeto',
  'Negar Energia',
  'Relâmpago da Força',
  'Rompimento da Força',
  'Transferência Vital',
  'Truque Mental',
  'Visão Distante',
].map(toCatalogItem);

const vehicleCatalog = ['X-wing', 'TIE Fighter', 'Y-wing', 'Millennium Falcon', 'Speeder bike', 'AT-ST'].map(toCatalogItem);

const forceTalentDetailsCatalog: DetailCatalogItem[] = [...sagaForceTalentDetailsCatalog];
const talentDetailsCatalog: DetailCatalogItem[] = [...sagaTalentDetailsCatalog, ...forceTalentDetailsCatalog];

const forcePowerDetailsCatalog: DetailCatalogItem[] = [
  detailItem('Estrangulamento da Força', 'Poder da Força', 'Restringe uma criatura e causa dano conforme o teste de Usar a Força.', 'Lado Negro'),
  detailItem('Desarmar da Força', 'Poder da Força', 'Usa telecinese para desarmar o alvo; pode derrubar o item ou trazê-lo para sua mão.', 'Telecinese'),
  detailItem('Empurrão da Força', 'Poder da Força', 'Empurra o alvo para trás com teste resistido e pode causar dano por colisão.', 'Telecinese'),
  detailItem('Fúria Sombria', 'Poder da Força', 'Concede bônus de fúria em ataques e dano corpo a corpo por meio do Lado Negro.', 'Lado Negro'),
  detailItem('Impulso', 'Poder da Força', 'Aumenta movimento e saltos usando a Força.', 'Movimento'),
  detailItem('Mover Objeto', 'Poder da Força', 'Move objetos ou criaturas e pode arremessá-los para causar dano.', 'Telecinese'),
  detailItem('Negar Energia', 'Poder da Força', 'Reduz ou anula dano de energia recebido, dependendo do teste.', 'Defensivo'),
  detailItem('Relâmpago da Força', 'Poder da Força', 'Ataque do Lado Negro que causa dano e move o alvo no marcador de condição.', 'Lado Negro'),
  detailItem('Rompimento da Força', 'Poder da Força', 'Dificulta ou corta temporariamente o acesso de outro usuário a Pontos e poderes da Força.', 'Lado da Luz'),
  detailItem('Transferência Vital', 'Poder da Força', 'Cura outra criatura viva usando sua própria força vital.', 'Lado da Luz'),
  detailItem('Truque Mental', 'Poder da Força', 'Altera percepção, cria sugestão, distração ou medo em uma criatura com mente.', 'Afetar a mente'),
  detailItem('Visão Distante', 'Poder da Força', 'Permite receber impressão vaga de eventos envolvendo uma criatura conhecida distante.', 'Percepção'),
];

const forceTechniqueDetailsCatalog: DetailCatalogItem[] = [
  detailItem('Recuperar Ponto da Força', 'Técnica da Força', 'No fim de um encontro, recupera automaticamente 1 Ponto da Força gasto durante esse encontro.', 'Técnica'),
  detailItem('Mestria com Poder da Força', 'Técnica da Força', 'Escolha um poder; você pode escolher 10 para ativá-lo mesmo sob ameaça.', 'Técnica'),
  detailItem('Transe da Força Aprimorado', 'Técnica da Força', 'Melhora a recuperação de pontos de vida durante transe da Força.', 'Técnica'),
];

const forceSecretDetailsCatalog: DetailCatalogItem[] = [
  detailItem('Poder Devastador', 'Segredo da Força', 'Aprimora um poder da Força para gerar efeito mais intenso.', 'Segredo'),
  detailItem('Poder Multialvo', 'Segredo da Força', 'Permite ampliar um poder para afetar mais de um alvo quando aplicável.', 'Segredo'),
  detailItem('Poder Rápido', 'Segredo da Força', 'Reduz o tempo de ativação de um poder escolhido quando aplicável.', 'Segredo'),
];

const forceTraditionCatalog: CatalogItem[] = [
  toCatalogItem('Sem tradição'),
  toCatalogItem('Jedi'),
  toCatalogItem('Sith'),
  toCatalogItem('Jensaarai'),
  toCatalogItem('Bruxas de Dathomir'),
  toCatalogItem('Outra tradição'),
];

const forceActionSummaries = [
  {
    title: 'Ativar poder',
    meta: 'Ação do poder',
    text: 'Escolha o poder, consuma a ação indicada, teste Usar a Força, resolva o efeito e marque o poder como gasto no encontro.',
    highlights: [
      { label: 'Rolagem', value: 'Usar a Força', tone: 'roll' },
      { label: 'Ação', value: 'Conforme o poder', tone: 'action' },
    ],
  },
  {
    title: 'Sentir a Força',
    meta: 'Percepção mística',
    text: 'Detecta seres vivos, usuários da Força, locais poderosos e perturbações, conforme alcance, linha de efeito e concentração.',
    highlights: [{ label: 'Rolagem', value: 'Usar a Força', tone: 'roll' }],
  },
  {
    title: 'Sentir arredores',
    meta: 'Alerta',
    text: 'Ajuda a perceber perigos próximos, presenças hostis, criaturas escondidas e movimento ao redor do personagem.',
    highlights: [{ label: 'Rolagem', value: 'Usar a Força', tone: 'roll' }],
  },
  {
    title: 'Telepatia',
    meta: 'Comunicação mental',
    text: 'Permite contato mental simples com alvo válido; exige concentração e não transmite conhecimento complexo.',
    highlights: [{ label: 'Rolagem', value: 'Usar a Força', tone: 'roll' }],
  },
  {
    title: 'Transe da Força',
    meta: 'Meditação',
    text: 'Estado meditativo usado para descanso, recuperação e introspecção, mantendo o personagem consciente.',
    highlights: [{ label: 'Rolagem', value: 'Usar a Força', tone: 'roll' }],
  },
  {
    title: 'Foco da Força',
    meta: 'Ação completa, CD 15',
    text: 'Com um teste de Usar a Força CD 15, recupera 1 poder da Força gasto.',
    highlights: [
      { label: 'Rolagem', value: 'Usar a Força CD 15', tone: 'roll' },
      { label: 'Ação', value: 'Ação completa', tone: 'action' },
    ],
  },
] satisfies Array<{ title: string; meta: string; text: string; highlights: RuleChip[] }>;

const equipmentDetailsCatalog: DetailCatalogItem[] = [...sagaEquipmentDetailsCatalog];

const vehicleDetailsCatalog: DetailCatalogItem[] = [...sagaVehicleDetailsCatalog];

const droidSystemDetailsCatalog: DetailCatalogItem[] = [...sagaDroidDetailsCatalog];
const readyDroidCategories = new Set(['Dróides civis', 'Dróides militares', 'Dróides especiais']);
const readyDroidDetailsCatalog = droidSystemDetailsCatalog.filter((item) => readyDroidCategories.has(item.category || ''));
const droidBuilderDetailsCatalog = droidSystemDetailsCatalog.filter((item) => !readyDroidCategories.has(item.category || ''));

const abilityLabels: Record<AbilityKey, string> = {
  strength: 'Força',
  dexterity: 'Destreza',
  constitution: 'Constituição',
  intelligence: 'Inteligência',
  wisdom: 'Sabedoria',
  charisma: 'Carisma',
};

function createSheet(): CharacterSheet {
  return {
    id: crypto.randomUUID(),
    characterName: 'Novo personagem',
    playerName: '',
    campaignName: '',
    era: 'rebellion-era',
    destiny: '',
    gender: '',
    age: '',
    height: '',
    weight: '',
    eyes: '',
    hair: '',
    skin: '',
    homeworld: '',
    languages: '',
    background: '',
    personality: '',
    appearance: '',
    portraitUrl: '',
    portraitBlobPath: '',
    speciesSlug: 'humano',
    classSlug: 'jedi',
    classLevels: [{ classSlug: 'jedi', level: 1 }],
    totalLevel: 1,
    heroicLevel: 1,
    prestigeLevel: 0,
    abilities: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    hitPointsCurrent: 0,
    hitPointsMaximum: 0,
    hitPointsTemporary: 0,
    damageTaken: 0,
    conditionStep: 0,
    speed: 6,
    destinyPoints: 2,
    forcePoints: 6,
    darkSideScore: 0,
    skills: skillCatalog.map((skill) => ({ skillSlug: skill.slug, trained: false, focused: false, misc: 0 })),
    feats: [],
    talents: [],
    forceSensitivity: false,
    forcePowers: [],
    forceTechniques: [],
    forceSecrets: [],
    forceTradition: '',
    inventory: [],
    equippedWeapons: [],
    equippedArmor: '',
    credits: 0,
    vehicles: [],
    assignedVehicle: '',
    droidDegree: '',
    droidSystems: [],
    notes: '',
    progressionLog: '',
    levelHistory: [],
    sheetVersions: [],
    versionNote: 'Rascunho inicial',
    isFinalized: false,
    updatedAt: new Date().toISOString(),
  };
}

function loadSheets(): CharacterSheet[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [createSheet()];
  try {
    const parsed = JSON.parse(raw) as CharacterSheet[];
    return parsed.length ? parsed.map(normalizeSheet) : [createSheet()];
  } catch {
    return [createSheet()];
  }
}

function normalizeSheet(sheet: CharacterSheet): CharacterSheet {
  const sourceSkills = sheet.skills ?? [];
  const existingSkills = new Map(sourceSkills.map((skill) => [skill.skillSlug, skill]));
  const classLevels = sheet.classLevels?.length
    ? sheet.classLevels
    : [{ classSlug: sheet.classSlug || 'jedi', level: Math.max(1, sheet.totalLevel || 1) }];
  const totalLevel = classLevels.reduce((total, classLevel) => total + Math.max(0, classLevel.level), 0);

  return {
    ...sheet,
    portraitUrl: sheet.portraitUrl ?? '',
    portraitBlobPath: sheet.portraitBlobPath ?? '',
    languages: sheet.languages ?? '',
    classSlug: sheet.classSlug || classLevels[0]?.classSlug || 'jedi',
    classLevels,
    totalLevel: totalLevel || sheet.totalLevel || 1,
    heroicLevel: totalLevel || sheet.heroicLevel || sheet.totalLevel || 1,
    skills: skillCatalog.map((skill) => existingSkills.get(skill.slug) ?? { skillSlug: skill.slug, trained: false, focused: false, misc: 0 }),
    levelHistory: sheet.levelHistory ?? [],
    sheetVersions: sheet.sheetVersions ?? [],
    isFinalized: sheet.isFinalized ?? ((sheet.sheetVersions?.length ?? 0) > 0),
  };
}

function isPristineSheet(sheet: CharacterSheet) {
  return (
    sheet.characterName === 'Novo personagem' &&
    !sheet.isFinalized &&
    sheet.sheetVersions.length === 0 &&
    sheet.levelHistory.length === 0 &&
    sheet.totalLevel <= 1 &&
    sheet.feats.length === 0 &&
    sheet.talents.length === 0 &&
    sheet.forcePowers.length === 0 &&
    sheet.inventory.length === 0 &&
    sheet.notes.trim() === '' &&
    Object.values(sheet.abilities).every((value) => value === 10)
  );
}

function mergeSheets(localSheets: CharacterSheet[], remoteSheets: CharacterSheet[]): CharacterSheet[] {
  // Nunca substitui fichas locais pelas remotas: fichas que só existem localmente
  // ainda não foram sincronizadas e seriam perdidas. Em conflito de id, vence a
  // edição mais recente.
  const merged = new Map<string, CharacterSheet>();

  for (const remote of remoteSheets) {
    merged.set(remote.id, remote);
  }

  for (const local of localSheets) {
    const remote = merged.get(local.id);
    if (!remote) {
      merged.set(local.id, local);
      continue;
    }

    const localTime = Date.parse(local.updatedAt ?? '') || 0;
    const remoteTime = Date.parse(remote.updatedAt ?? '') || 0;
    if (localTime > remoteTime) {
      merged.set(local.id, local);
    }
  }

  const all = [...merged.values()];
  const edited = all.filter((sheet) => !isPristineSheet(sheet));

  if (edited.length > 0) return edited;
  return all.length > 0 ? [all[0]] : [createSheet()];
}

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

type SeoInput = {
  title: string;
  description: string;
  image?: string;
  path?: string;
  type?: 'website' | 'article';
};

function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, window.location.origin).toString();
}

function shouldShowImageCredit(rule: Pick<WikiRule, 'imageUrl' | 'imageSourceUrl' | 'imageAttribution' | 'imageProvider'>) {
  const provider = String(rule.imageProvider ?? '').toLowerCase();
  const source = String(rule.imageSourceUrl ?? '').toLowerCase();
  const imageUrl = String(rule.imageUrl ?? '').toLowerCase();

  if (provider === 'vercel blob' || source.startsWith('local:')) return false;
  if (imageUrl.includes('.blob.vercel-storage.com')) return false;

  return Boolean(rule.imageSourceUrl || rule.imageAttribution || rule.imageProvider);
}

function setMetaAttribute(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function applySeo({ title, description, image, path, type = 'website' }: SeoInput) {
  const canonicalUrl = absoluteUrl(path ?? window.location.pathname);
  const imageUrl = absoluteUrl(image ?? `/api/og-image?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(description)}`);

  document.title = title;
  setMetaAttribute('name', 'description', description);
  setMetaAttribute('property', 'og:type', type);
  setMetaAttribute('property', 'og:site_name', SITE_NAME);
  setMetaAttribute('property', 'og:title', title);
  setMetaAttribute('property', 'og:description', description);
  setMetaAttribute('property', 'og:url', canonicalUrl);
  setMetaAttribute('property', 'og:image', imageUrl);
  setMetaAttribute('property', 'og:image:alt', title);
  setMetaAttribute('property', 'og:image:width', '1200');
  setMetaAttribute('property', 'og:image:height', '630');
  setMetaAttribute('property', 'og:locale', 'pt_BR');
  setMetaAttribute('name', 'twitter:card', 'summary_large_image');
  setMetaAttribute('name', 'twitter:title', title);
  setMetaAttribute('name', 'twitter:description', description);
  setMetaAttribute('name', 'twitter:image', imageUrl);
  setMetaAttribute('name', 'twitter:image:alt', title);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', canonicalUrl);
}

async function readRemoteSheets() {
  const response = await fetch(apiUrl('/api/web-sheets'), {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Não foi possível carregar fichas do Mongo.');
  }

  const payload = (await response.json()) as { sheets?: CharacterSheet[] };
  return (payload.sheets ?? []).map(normalizeSheet);
}

async function saveRemoteSheet(sheet: CharacterSheet) {
  const response = await fetch(apiUrl(`/api/web-sheets/${encodeURIComponent(sheet.id)}`), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ sheet }),
  });

  if (!response.ok) {
    throw new Error('Não foi possível salvar ficha no Mongo.');
  }
}

async function archiveRemoteSheet(sheetId: string) {
  const response = await fetch(apiUrl(`/api/web-sheets/${encodeURIComponent(sheetId)}`), {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Não foi possível arquivar ficha no Mongo.');
  }
}

async function uploadCharacterPortrait(input: { characterId: string; file: File }) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')));
    reader.addEventListener('error', () => reject(reader.error ?? new Error('Não foi possível ler a imagem.')));
    reader.readAsDataURL(input.file);
  });
  const response = await fetch(apiUrl('/api/character-portraits'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      characterId: input.characterId,
      fileName: input.file.name,
      contentType: input.file.type,
      dataUrl,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error ?? 'Não foi possível enviar o retrato.');
  }

  return await response.json() as { url: string; pathname: string; contentType: string };
}

async function readAuthSession() {
  const response = await fetch(apiUrl('/api/auth/me'), {
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { user?: AuthUser | null };
  return payload.user ?? null;
}

async function logoutRemoteSession() {
  await fetch(apiUrl('/api/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });
}

async function readWikiRules(filters: { systemSlug?: string; query?: string; type?: string; limit?: number } = {}) {
  const params = new URLSearchParams({
    system: filters.systemSlug ?? 'star-wars-saga',
    limit: String(filters.limit ?? 120),
  });

  if (filters.query) params.set('q', filters.query);
  if (filters.type) params.set('type', filters.type);

  const response = await fetch(apiUrl(`/api/wiki/rules?${params.toString()}`));

  if (!response.ok) {
    throw new Error('Não foi possível carregar a wiki.');
  }

  const payload = (await response.json()) as { rules?: WikiRule[] };
  return payload.rules ?? [];
}

async function readWikiRule(systemSlug: string, slug: string) {
  const params = new URLSearchParams({ system: systemSlug, slug });
  const response = await fetch(apiUrl(`/api/wiki/rules?${params.toString()}`));

  if (response.ok) {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      return (await response.json()) as { rule: WikiRule; related: WikiRule[] };
    }
  }

  const rules = await readWikiRules({ systemSlug, limit: 200 });
  const rule = rules.find((item) => item.slug === slug);

  if (!rule) {
    throw new Error('Não foi possível carregar esta regra.');
  }

  const related = rules
    .filter((item) => item.slug !== slug)
    .filter((item) =>
      item.type === rule.type ||
      item.category === rule.category ||
      item.tags.some((tag) => rule.tags.includes(tag)),
    )
    .slice(0, 8);

  return { rule, related };
}

function modifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function toCatalogItem(name: string): CatalogItem {
  return { name, slug: slugify(name) };
}

function detailItem(
  name: string,
  summary: string,
  details: string,
  category?: string,
  classRestriction?: string[],
): DetailCatalogItem {
  return {
    ...toCatalogItem(name),
    summary,
    details,
    category,
    classRestriction,
  };
}

function species(
  name: string,
  abilityModifiers: Partial<Record<AbilityKey, number>>,
  defenseBonuses: Partial<Record<DefenseKey, number>>,
  skillBonuses: Record<string, number>,
  speed: number,
  size: string,
  traits: string[],
  description: string,
): SpeciesCatalogItem {
  return {
    ...toCatalogItem(name),
    size,
    speed,
    abilityModifiers: { ...emptyAbilityMods, ...abilityModifiers },
    defenseBonuses: { ...emptyDefenseBonuses, ...defenseBonuses },
    skillBonuses,
    traits,
    description,
  };
}

function heroicClass(input: Omit<ClassCatalogItem, 'slug'>): ClassCatalogItem {
  return {
    ...toCatalogItem(input.name),
    ...input,
  };
}

function signed(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

function getClassLevel(sheet: CharacterSheet, classSlug: string) {
  return sheet.classLevels.find((classLevel) => classLevel.classSlug === classSlug)?.level ?? 0;
}

function calculateBaseAttackFromClassLevels(classLevels: ClassLevelEntry[]) {
  return classLevels.reduce((total, classLevel) => {
    const classData = heroicClassCatalog.find((item) => item.slug === classLevel.classSlug);
    if (!classData) return total;
    return total + classLevel.level;
  }, 0);
}

function calculateClassDefenseBonuses(classLevels: ClassLevelEntry[]) {
  return classLevels.reduce<Record<DefenseKey, number>>(
    (bonuses, classLevel) => {
      if (classLevel.level <= 0) return bonuses;
      const classData = heroicClassCatalog.find((item) => item.slug === classLevel.classSlug);
      if (!classData) return bonuses;

      return {
        reflex: Math.max(bonuses.reflex, classData.defenseBonuses.reflex),
        fortitude: Math.max(bonuses.fortitude, classData.defenseBonuses.fortitude),
        will: Math.max(bonuses.will, classData.defenseBonuses.will),
      };
    },
    { reflex: 0, fortitude: 0, will: 0 },
  );
}

function dieMaximum(hitDie: string) {
  const sides = Number(hitDie.replace(/\D/g, '')) || 6;
  return sides;
}

function forcePointsForLevel(level: number) {
  return level > 0 ? 6 : 0;
}

function destinyPointsForLevel(level: number) {
  return level > 0 ? 2 : 0;
}

function calculateSkillBreakdown(
  sheet: CharacterSheet,
  species: SpeciesCatalogItem,
  abilities: Record<AbilityKey, { base: number; species: number; total: number }>,
  skill: SkillEntry,
) {
  const catalog = skillCatalog.find((item) => item.slug === skill.skillSlug);
  const ability = catalog?.ability ?? 'strength';
  const speciesSkillBonus = species.skillBonuses[skill.skillSlug] ?? 0;
  const halfLevelBonus = Math.floor(sheet.totalLevel / 2);
  const abilityModifier = modifier(abilities[ability].total);
  const levelAndAbilityBonus = halfLevelBonus + abilityModifier;
  const trainingBonus = skill.trained ? 5 : 0;
  const focusBonus = skill.focused ? 5 : 0;
  const otherBonus = speciesSkillBonus + skill.misc;
  const total = levelAndAbilityBonus + trainingBonus + focusBonus + otherBonus;

  return {
    ability,
    abilityModifier,
    catalog,
    focusBonus,
    halfLevelBonus,
    levelAndAbilityBonus,
    otherBonus,
    speciesSkillBonus,
    total,
    trainingBonus,
  };
}

function classProgressionGain(level: number) {
  return level % 2 === 1 ? 'Talento de classe' : 'Aptidão bônus da classe';
}

function levelRequiresAbilityBoost(level: number) {
  return level > 0 && level % 4 === 0;
}

function buildSheetSnapshot(sheet: CharacterSheet): Record<string, unknown> {
  const {
    sheetVersions: _sheetVersions,
    portraitUrl: _portraitUrl,
    portraitBlobPath: _portraitBlobPath,
    ...snapshot
  } = sheet;
  return snapshot as unknown as Record<string, unknown>;
}

function SourceLegend() {
  return (
    <div className="source-legend">
      <span className="base-source">Base da ficha</span>
      <span className="species-source">Bônus de raça</span>
      <span className="class-source">Bônus de classe</span>
    </div>
  );
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function labelFor(items: CatalogItem[], slug: string) {
  return items.find((item) => item.slug === slug)?.name ?? slug;
}

function wikiHref(slug: string) {
  return `/wiki/star-wars-saga/${slug}`;
}

function WikiLink({ slug, children, className = 'wiki-inline-link' }: { slug?: string; children: ReactNode; className?: string }) {
  if (!slug) return <>{children}</>;
  return <a className={className} href={wikiHref(slug)}>{children}</a>;
}

const featNameAliases: Record<string, string> = {
  'sensitivo-a-forca': 'sensivel-a-forca',
  'proficiencia-armadura-leve': 'proficiencia-em-armaduras-leves',
  'proficiencia-armadura-media': 'proficiencia-em-armaduras-medias',
  'proficiencia-armadura-pesada': 'proficiencia-em-armaduras-pesadas',
  'proficiencia-em-armaduras-leves': 'proficiencia-em-armaduras-leves',
  'proficiencia-em-armaduras-medias': 'proficiencia-em-armaduras-medias',
  'proficiencia-em-armaduras-pesadas': 'proficiencia-em-armaduras-pesadas',
  'proficiencia-armas-exoticas': 'proficiencia-em-armas-exoticas',
  'cirurgia-cibernetica': 'instalar-protese-cibernetica',
  'tecnico-especialista': 'especialista-tecnico',
};

function matchesFeatName(item: FeatCatalogItem, name: string) {
  const wantedSlug = slugify(name);
  return item.slug === wantedSlug || item.slug === featNameAliases[wantedSlug];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}

function renderInlineMarkdown(text: string) {
  return text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g).map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return <a key={`${part}-${index}`} href={link[2]}>{link[1]}</a>;
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return <b key={`${part}-${index}`}>{part.slice(2, -2)}</b>;
    }

    return part;
  });
}

function renderFormattedText(text: string) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  const isMarkdownTableSeparator = (value: string) => {
    const cells = value.split('|').slice(1, -1).map((cell) => cell.trim());
    return cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell));
  };

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();
    if (!line || line === '---') continue;

    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        if (lines[index].trim()) {
          codeLines.push(lines[index].trim());
        }
        index += 1;
      }

      if (codeLines.length > 0) {
        blocks.push(
          <div className="markdown-code-block" key={`code-${index}`}>
            {codeLines.map((codeLine, codeIndex) => <code key={`${codeLine}-${codeIndex}`}>{renderInlineMarkdown(codeLine)}</code>)}
          </div>,
        );
      }
      continue;
    }

    if (line.startsWith('|') && lines[index + 1]?.trim().startsWith('|') && isMarkdownTableSeparator(lines[index + 1].trim())) {
      const headers = line.split('|').slice(1, -1).map((cell) => cell.trim());
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(lines[index].split('|').slice(1, -1).map((cell) => cell.trim()));
        index += 1;
      }

      index -= 1;
      blocks.push(
        <div className="markdown-table-wrap" key={`table-${index}`}>
          <table className="markdown-table">
            <thead>
              <tr>{headers.map((header) => <th key={header}>{renderInlineMarkdown(header)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{renderInlineMarkdown(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^#{2,6}\s+/.test(line)) {
      blocks.push(<h4 key={`heading-${index}`}>{renderInlineMarkdown(line.replace(/^#{2,6}\s+/, ''))}</h4>);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }
      index -= 1;
      blocks.push(
        <ul key={`list-${index}`}>
          {items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>)}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      index -= 1;
      blocks.push(
        <ol key={`numbered-${index}`}>
          {items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>)}
        </ol>,
      );
      continue;
    }

    const stat = line.match(/^([^:]{2,42}):\s+(.+)$/);
    if (stat) {
      blocks.push(
        <div className="detail-stat-line" key={`stat-${index}`}>
          <b>{renderInlineMarkdown(stat[1])}</b>
          <span>{renderInlineMarkdown(stat[2])}</span>
        </div>,
      );
      continue;
    }

    if (line.endsWith(':')) {
      blocks.push(<strong className="detail-section-label" key={`label-${index}`}>{renderInlineMarkdown(line)}</strong>);
      continue;
    }

    blocks.push(<p key={`paragraph-${index}`}>{renderInlineMarkdown(line)}</p>);
  }

  return blocks.length > 0 ? <div className="formatted-text">{blocks}</div> : <p>Nenhuma descrição catalogada.</p>;
}

function stripRuleText(text: string) {
  return text
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueRuleChips(chips: RuleChip[]) {
  const seen = new Set<string>();
  return chips.filter((chip) => {
    const key = `${chip.label}:${chip.value}`.toLocaleLowerCase('pt-BR');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectRuleHighlights(text: string): RuleChip[] {
  const normalized = stripRuleText(text);
  const chips: RuleChip[] = [];

  const pushMatches = (regex: RegExp, label: string, tone: RuleChip['tone'], limit = 4) => {
    const matches = Array.from(normalized.matchAll(regex)).map((match) => stripRuleText(match[0]));
    uniqueRuleChips(matches.map((value) => ({ label, value, tone }))).slice(0, limit).forEach((chip) => chips.push(chip));
  };

  pushMatches(/(?:[+-]\s*)?\d+d(?:2|3|4|6|8|10|12|20)(?:\s*(?:x|×)\s*\d+)?(?:\s*(?:[+-])\s*\d+)?\*?(?:\s*\([^)]{1,24}\))?/gi, 'Dano', 'damage', 5);
  pushMatches(/\b(?:CD|ND)\s*\d+\b/gi, 'Teste', 'roll', 4);
  pushMatches(/\b(?:Usar a Força|Mecânica|Acrobacia|Força|Percepção|Iniciativa)\s+(?:CD|ND)\s*\d+\b/gi, 'Rolagem', 'roll', 4);
  pushMatches(/\b(?:ação rápida|ação padrão|ação de movimento|ação completa|ação de rodada completa|ação livre|reação)\b/gi, 'Ação', 'action', 3);
  pushMatches(/\b(?:até|raio de explosão de|raio de)\s+\d+\s+quadrados?\b/gi, 'Alcance', 'range', 3);
  pushMatches(/\b\d+\s+pontos?\s+da força\b/gi, 'Custo', 'cost', 3);

  return uniqueRuleChips(chips).slice(0, 10);
}

function RuleHighlights({ item, text, chips, compact = false }: { item?: Partial<DetailCatalogItem> & Partial<FeatCatalogItem>; text?: string; chips?: RuleChip[]; compact?: boolean }) {
  const sourceText = text ?? [item?.summary, item?.details, item?.extra, item?.meta, item?.benefit, item?.normal, item?.special]
    .filter(Boolean)
    .join(' ');
  const highlights = chips ?? collectRuleHighlights(sourceText);

  if (highlights.length === 0) return null;

  return (
    <div className={compact ? 'rule-chip-list compact' : 'rule-chip-list'} aria-label="Dados, dano e rolagens importantes">
      {highlights.map((chip) => (
        <span className={`rule-chip ${chip.tone}`} key={`${chip.label}-${chip.value}`}>
          <b>{chip.label}</b>
          {chip.value}
        </span>
      ))}
    </div>
  );
}

function UserBadge({ user }: { user: AuthUser }) {
  return (
    <div className="account-card compact">
      <GoogleAccountAvatar user={user} />
      <div>
        <span>{user.name}</span>
        <small>{user.email}</small>
      </div>
    </div>
  );
}

function GoogleAccountAvatar({ user }: { user: AuthUser }) {
  const [failed, setFailed] = useState(false);

  if (!user.picture || failed) {
    return <UserRound aria-hidden="true" />;
  }

  return <img alt="" className="google-account-avatar" referrerPolicy="no-referrer" src={user.picture} onError={() => setFailed(true)} />;
}

function WikiApp({
  authUser,
  authLoaded,
  onLogin,
  onLogout,
}: {
  authUser: AuthUser | null;
  authLoaded: boolean;
  onLogin: () => void;
  onLogout: () => void;
}) {
  const [rules, setRules] = useState<WikiRule[]>([]);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const routeParts = window.location.pathname.split('/').filter(Boolean);
  const routeSystemSlug = routeParts[1] ?? 'star-wars-saga';
  const routeRuleSlug = routeParts[2] ?? '';
  const activeSystem = wikiSystems.find((system) => system.slug === routeSystemSlug) ?? wikiSystems[0];
  const ruleTypes = [
    ['', 'Tudo'],
    ['class', 'Classes'],
    ['feat', 'Aptidões'],
    ['equipment', 'Equipamentos'],
    ['talent', 'Talentos'],
    ['vehicle', 'Veículos'],
    ['droid', 'Dróides'],
  ];

  useEffect(() => {
    if (window.location.pathname === '/wiki') {
      window.history.replaceState(null, '', `/wiki/${activeSystem.slug}`);
    }
  }, [activeSystem.slug]);

  useEffect(() => {
    applySeo({
      title: `${activeSystem.name} | Wiki RPG Builder`,
      description: `Wiki pública de ${activeSystem.name} com equipamentos, talentos, veículos, dróides e regras catalogadas.`,
      path: `/wiki/${activeSystem.slug}`,
    });
  }, [activeSystem.name, activeSystem.slug]);

  if (routeRuleSlug) {
    return (
      <WikiRuleDetail
        activeSystem={activeSystem}
        authLoaded={authLoaded}
        authUser={authUser}
        onLogin={onLogin}
        onLogout={onLogout}
        slug={routeRuleSlug}
      />
    );
  }

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      readWikiRules({ systemSlug: activeSystem.slug, query, type })
        .then((nextRules) => {
          if (!cancelled) setRules(nextRules);
        })
        .catch((loadError) => {
          if (!cancelled) {
            setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a wiki.');
            setRules([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeSystem.slug, query, type]);

  return (
    <main className="wiki-shell">
      <header className="global-header">
        <button className="brand-link" type="button" onClick={() => { window.location.href = '/app'; }}>
          <Dice5 aria-hidden="true" />
          <span>RPG Builder</span>
        </button>
        <nav className="global-nav" aria-label="Navegação principal">
          <button type="button" onClick={() => { window.location.href = '/app'; }}>Ficha</button>
          <button className="active" type="button" onClick={() => { window.location.href = `/wiki/${activeSystem.slug}`; }}>Wiki</button>
        </nav>
        <div className="global-account">
          {!authLoaded && <span>Carregando sessão...</span>}
          {authLoaded && authUser && <UserBadge user={authUser} />}
          {authLoaded && authUser && <button type="button" onClick={onLogout}>Sair</button>}
          {authLoaded && !authUser && <button type="button" onClick={onLogin}>Entrar</button>}
        </div>
      </header>

      <section className="wiki-topbar">
        <div>
          <span>Wiki / {activeSystem.slug}</span>
          <h1>{activeSystem.name}</h1>
        </div>
        <button type="button" onClick={() => { window.location.href = '/app'; }}>Criar ficha</button>
      </section>

      <section className="wiki-controls" aria-label="Filtros da wiki">
        <label>
          <Search aria-hidden="true" />
          <input value={query} placeholder="Buscar regra, arma, talento..." onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="wiki-type-tabs">
          {ruleTypes.map(([value, label]) => (
            <button className={type === value ? 'active' : ''} key={value || 'all'} type="button" onClick={() => setType(value)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {loading && (
        <div className="wiki-grid" aria-label="Carregando regras">
          {Array.from({ length: 8 }).map((_, index) => (
            <article className="wiki-card skeleton-card" key={index}>
              <span />
              <strong />
              <p />
              <p />
            </article>
          ))}
        </div>
      )}

      {!loading && error && <p className="wiki-message">{error}</p>}
      {!loading && !error && rules.length === 0 && <p className="wiki-message">Nenhuma regra encontrada. Rode o seed do catálogo ou ajuste os filtros.</p>}

      {!loading && !error && rules.length > 0 && (
        <div className="wiki-grid">
          {rules.map((rule) => (
            <article className="wiki-card" key={rule.id}>
              {rule.imageUrl && (
                <img
                  className="wiki-card-image"
                  src={rule.imageUrl}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="preview-heading">
                <strong>{rule.name}</strong>
                <small>{rule.category || rule.type}</small>
              </div>
              {rule.type !== 'class' && (
                <RuleHighlights text={[rule.summary, rule.content, Object.values(rule.stats ?? {}).join(' ')].join(' ')} compact />
              )}
              <p>{rule.summary || 'Sem resumo catalogado.'}</p>
              <button className="wiki-card-link" type="button" onClick={() => { window.location.href = `/wiki/${activeSystem.slug}/${rule.slug}`; }}>
                Ver detalhes
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function WikiRuleDetail({
  activeSystem,
  authUser,
  authLoaded,
  onLogin,
  onLogout,
  slug,
}: {
  activeSystem: WikiSystem;
  authUser: AuthUser | null;
  authLoaded: boolean;
  onLogin: () => void;
  onLogout: () => void;
  slug: string;
}) {
  const [rule, setRule] = useState<WikiRule | null>(null);
  const [related, setRelated] = useState<WikiRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    readWikiRule(activeSystem.slug, slug)
      .then((payload) => {
        if (cancelled) return;
        setRule(payload.rule);
        setRelated(payload.related ?? []);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar esta regra.');
          setRule(null);
          setRelated([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeSystem.slug, slug]);

  useEffect(() => {
    if (!rule) return;

    applySeo({
      title: `${rule.name} | ${activeSystem.shortName}`,
      description: rule.summary || `Consulte ${rule.name} na wiki pública de ${activeSystem.name}.`,
      image: rule.imageUrl || undefined,
      path: `/wiki/${activeSystem.slug}/${rule.slug}`,
      type: 'article',
    });
  }, [activeSystem.name, activeSystem.shortName, activeSystem.slug, rule]);

  return (
    <main className="wiki-shell">
      <header className="global-header">
        <button className="brand-link" type="button" onClick={() => { window.location.href = '/app'; }}>
          <Dice5 aria-hidden="true" />
          <span>RPG Builder</span>
        </button>
        <nav className="global-nav" aria-label="Navegação principal">
          <button type="button" onClick={() => { window.location.href = '/app'; }}>Ficha</button>
          <button className="active" type="button" onClick={() => { window.location.href = `/wiki/${activeSystem.slug}`; }}>Wiki</button>
        </nav>
        <div className="global-account">
          {!authLoaded && <span>Carregando sessão...</span>}
          {authLoaded && authUser && <UserBadge user={authUser} />}
          {authLoaded && authUser && <button type="button" onClick={onLogout}>Sair</button>}
          {authLoaded && !authUser && <button type="button" onClick={onLogin}>Entrar</button>}
        </div>
      </header>

      <section className="wiki-detail-shell">
        <button className="wiki-back-button" type="button" onClick={() => { window.location.href = `/wiki/${activeSystem.slug}`; }}>
          Voltar para {activeSystem.shortName}
        </button>

        {loading && (
          <article className="wiki-detail-card skeleton-card">
            <span />
            <strong />
            <p />
            <p />
            <p />
          </article>
        )}

        {!loading && error && <p className="wiki-message">{error}</p>}

        {!loading && !error && rule && (
          <div className="wiki-detail-layout">
            <article className="wiki-detail-card">
              <div className="wiki-detail-heading">
                <span>{activeSystem.shortName} / {rule.type}</span>
                <h1>{rule.name}</h1>
                <small>{rule.category || 'Geral'}</small>
              </div>
              {rule.imageUrl && (
                <figure className="wiki-detail-image">
                  <img src={rule.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
                  {shouldShowImageCredit(rule) && (
                    <figcaption>
                      Imagem:{' '}
                      {rule.imageSourceUrl ? (
                        <a href={rule.imageSourceUrl} target="_blank" rel="noreferrer">
                          {rule.imageAttribution || rule.imageProvider || 'fonte externa'}
                        </a>
                      ) : (
                        <span>{rule.imageAttribution || rule.imageProvider}</span>
                      )}
                    </figcaption>
                  )}
                </figure>
              )}
              {rule.type !== 'class' && (
                <RuleHighlights text={[rule.summary, rule.content, Object.values(rule.stats ?? {}).join(' ')].join(' ')} />
              )}
              {rule.summary && <p className="wiki-detail-summary">{rule.summary}</p>}
              {renderFormattedText(rule.content)}
              {Object.keys(rule.stats ?? {}).length > 0 && (
                <div className="wiki-stat-grid">
                  {Object.entries(rule.stats).map(([key, value]) => (
                    <div key={key}>
                      <span>{key}</span>
                      <strong>{String(value)}</strong>
                    </div>
                  ))}
                </div>
              )}
              {rule.source && <small className="wiki-source">Fonte: {rule.source}</small>}
            </article>

            <aside className="wiki-related">
              <h2>Regras relacionadas</h2>
              {related.length === 0 && <p>Nenhuma relação direta encontrada ainda.</p>}
              {related.map((relatedRule) => (
                <button key={relatedRule.id} type="button" onClick={() => { window.location.href = `/wiki/${activeSystem.slug}/${relatedRule.slug}`; }}>
                  <strong>{relatedRule.name}</strong>
                  <span>{relatedRule.category || relatedRule.type}</span>
                </button>
              ))}
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

export function App() {
  const isWikiRoute = window.location.pathname.startsWith('/wiki');
  const authError = new URLSearchParams(window.location.search).get('authError');
  const [sheets, setSheets] = useState<CharacterSheet[]>(loadSheets);
  const [activeId, setActiveId] = useState(() => sheets[0]?.id);
  const [activeTab, setActiveTab] = useState<SheetTab>(() => (sheets[0]?.isFinalized ? 'summary' : 'identity'));
  const [summaryVersionId, setSummaryVersionId] = useState('');
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const syncTimerRef = useRef<number | null>(null);
  const activeSheet = sheets.find((sheet) => sheet.id === activeId) ?? sheets[0];
  const activeSpecies = speciesCatalog.find((item) => item.slug === activeSheet.speciesSlug) ?? speciesCatalog[0];
  const activeClass = heroicClassCatalog.find((item) => item.slug === activeSheet.classSlug) ?? heroicClassCatalog[0];
  const activeStepIndex = Math.max(0, sheetTabs.findIndex((tab) => tab.id === activeTab));
  const activeStep = sheetTabs[activeStepIndex];
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === sheetTabs.length - 1;
  const progressPercent = ((activeStepIndex + 1) / sheetTabs.length) * 100;
  const [levelUpClassSlug, setLevelUpClassSlug] = useState(activeSheet.classSlug);
  const [levelUpHpGain, setLevelUpHpGain] = useState(0);
  const [levelUpTalentSlug, setLevelUpTalentSlug] = useState('');
  const [levelUpFeatSlug, setLevelUpFeatSlug] = useState('');
  const [levelUpAbilityOne, setLevelUpAbilityOne] = useState<AbilityKey>('strength');
  const [levelUpAbilityTwo, setLevelUpAbilityTwo] = useState<AbilityKey>('dexterity');
  const [levelUpNotes, setLevelUpNotes] = useState('');
  const [levelUpSaving, setLevelUpSaving] = useState(false);
  const [levelUpSaveError, setLevelUpSaveError] = useState('');
  const [portraitUploadingId, setPortraitUploadingId] = useState('');
  const [portraitError, setPortraitError] = useState('');

  useEffect(() => {
    if (isWikiRoute) return;

    applySeo({
      title: 'RPG Builder | Criador de fichas Star Wars Saga',
      description: DEFAULT_DESCRIPTION,
      path: window.location.pathname === '/' ? '/' : '/app',
    });
  }, [isWikiRoute]);

  useEffect(() => {
    setLevelUpClassSlug(activeSheet.classSlug);
    setLevelUpOpen(false);
  }, [activeSheet.id, activeSheet.classSlug]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  }, [sheets]);

  useEffect(() => {
    let cancelled = false;

    readAuthSession()
      .then((user) => {
        if (!cancelled) {
          setAuthUser(user);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAuthLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authLoaded || !authUser) return;

    let cancelled = false;
    setRemoteLoaded(false);

    readRemoteSheets()
      .then((remoteSheets) => {
        if (cancelled) return;

        // loadSheets() lê o localStorage, que o efeito de persistência mantém
        // sempre atualizado com o estado mais recente.
        const merged = mergeSheets(loadSheets(), remoteSheets);
        setSheets(merged);
        setActiveId((currentId) => (merged.some((sheet) => sheet.id === currentId) ? currentId : merged[0].id));
        setSummaryVersionId('');
      })
      .catch((error) => {
        // Mantém o cache local quando a API ou o Mongo estiverem indisponíveis.
        console.warn('Não foi possível carregar fichas remotas; mantendo as fichas locais.', error);
      })
      .finally(() => {
        if (!cancelled) {
          setRemoteLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoaded, authUser]);

  useEffect(() => {
    if (!authUser || !remoteLoaded) return;

    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = window.setTimeout(() => {
      void Promise.all(sheets.map((sheet) => saveRemoteSheet(sheet))).catch(() => {
        // O localStorage continua preservando a edição se o Mongo falhar momentaneamente.
      });
    }, 700);

    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [authUser, remoteLoaded, sheets]);

  const baseAttackBonus = useMemo(() => calculateBaseAttackFromClassLevels(activeSheet.classLevels), [activeSheet.classLevels]);
  const classDefenseBonuses = useMemo(() => calculateClassDefenseBonuses(activeSheet.classLevels), [activeSheet.classLevels]);

  const composedAbilities = Object.fromEntries(
    (Object.keys(activeSheet.abilities) as AbilityKey[]).map((key) => [
      key,
      {
        base: activeSheet.abilities[key],
        species: activeSpecies.abilityModifiers[key],
        total: activeSheet.abilities[key] + activeSpecies.abilityModifiers[key],
      },
    ]),
  ) as Record<AbilityKey, { base: number; species: number; total: number }>;

  const defenseBreakdown = {
    reflex: {
      base: 10,
      heroic: activeSheet.totalLevel,
      ability: modifier(composedAbilities.dexterity.total),
      species: activeSpecies.defenseBonuses.reflex,
      class: classDefenseBonuses.reflex,
    },
    fortitude: {
      base: 10,
      heroic: activeSheet.totalLevel,
      ability: modifier(composedAbilities.constitution.total),
      species: activeSpecies.defenseBonuses.fortitude,
      class: classDefenseBonuses.fortitude,
    },
    will: {
      base: 10,
      heroic: activeSheet.totalLevel,
      ability: modifier(composedAbilities.wisdom.total),
      species: activeSpecies.defenseBonuses.will,
      class: classDefenseBonuses.will,
    },
  };
  const defenses = Object.fromEntries(
    Object.entries(defenseBreakdown).map(([key, value]) => [
      key,
      value.base + value.heroic + value.ability + value.species + value.class,
    ]),
  ) as Record<DefenseKey, number>;
  const expectedStartingHitPoints = activeClass.startingHitPoints + modifier(composedAbilities.constitution.total);

  function updateActiveSheet(update: (sheet: CharacterSheet) => CharacterSheet) {
    setSheets((current) =>
      current.map((sheet) => (sheet.id === activeSheet.id ? { ...update(sheet), updatedAt: new Date().toISOString() } : sheet)),
    );
  }

  function setField<K extends keyof CharacterSheet>(key: K, value: CharacterSheet[K]) {
    updateActiveSheet((sheet) => ({ ...sheet, [key]: value }));
  }

  function openSheet(sheet: CharacterSheet) {
    setActiveId(sheet.id);
    setSummaryVersionId('');
    setLevelUpOpen(false);
    setActiveTab(sheet.isFinalized ? 'summary' : 'identity');
  }

  function viewSheetVersion(sheet: CharacterSheet, versionId: string) {
    setActiveId(sheet.id);
    setSummaryVersionId(versionId);
    setLevelUpOpen(false);
    setActiveTab('summary');
  }

  function sheetFromVersion(version: SheetVersion): CharacterSheet {
    const snapshot = version.snapshot as Partial<CharacterSheet>;

    return normalizeSheet({
      ...activeSheet,
      ...snapshot,
      id: activeSheet.id,
      portraitUrl: activeSheet.portraitUrl,
      portraitBlobPath: activeSheet.portraitBlobPath,
      skills: snapshot.skills ?? activeSheet.skills,
      sheetVersions: activeSheet.sheetVersions,
    } as CharacterSheet);
  }

  function updateSheetById(sheetId: string, update: (sheet: CharacterSheet) => CharacterSheet) {
    setSheets((current) =>
      current.map((sheet) => (sheet.id === sheetId ? { ...update(sheet), updatedAt: new Date().toISOString() } : sheet)),
    );
  }

  async function handlePortraitUpload(sheetId: string, file: File | null) {
    if (!file) return;

    setPortraitUploadingId(sheetId);
    setPortraitError('');

    try {
      const portrait = await uploadCharacterPortrait({ characterId: sheetId, file });
      updateSheetById(sheetId, (sheet) => ({
        ...sheet,
        portraitUrl: portrait.url,
        portraitBlobPath: portrait.pathname,
      }));
    } catch (error) {
      setPortraitError(error instanceof Error ? error.message : 'Não foi possível enviar o retrato.');
    } finally {
      setPortraitUploadingId('');
    }
  }

  function setSpeciesSlug(value: string) {
    const nextSpecies = speciesCatalog.find((item) => item.slug === value);
    updateActiveSheet((sheet) => ({
      ...sheet,
      speciesSlug: value,
      speed: nextSpecies?.speed ?? sheet.speed,
    }));
  }

  function setClassSlug(value: string) {
    const nextClass = heroicClassCatalog.find((item) => item.slug === value);
    const conTotal = activeSheet.abilities.constitution + activeSpecies.abilityModifiers.constitution;
    const suggestedHitPoints = (nextClass?.startingHitPoints ?? 0) + modifier(conTotal);

    updateActiveSheet((sheet) => ({
      ...sheet,
      classSlug: value,
      classLevels: [{ classSlug: value, level: Math.max(1, sheet.totalLevel || 1) }],
      talents: sheet.talents.filter((slug) => talentDetailsCatalog.find((item) => item.slug === slug)?.classRestriction?.includes(value)),
      hitPointsMaximum: sheet.hitPointsMaximum === 0 ? suggestedHitPoints : sheet.hitPointsMaximum,
      hitPointsCurrent: sheet.hitPointsCurrent === 0 ? suggestedHitPoints : sheet.hitPointsCurrent,
    }));
  }

  function addSheet() {
    const sheet = createSheet();
    setSheets((current) => [sheet, ...current]);
    setActiveId(sheet.id);
    setSummaryVersionId('');
    setLevelUpOpen(false);
    setActiveTab('identity');
  }

  function duplicateSheet() {
    const copy = {
      ...activeSheet,
      id: crypto.randomUUID(),
      characterName: `${activeSheet.characterName} copia`,
      sheetVersions: activeSheet.sheetVersions ?? [],
      isFinalized: false,
    };
    setSheets((current) => [copy, ...current]);
    setActiveId(copy.id);
    setSummaryVersionId('');
    setLevelUpOpen(false);
    setActiveTab('identity');
  }

  function deleteSheet() {
    void archiveRemoteSheet(activeSheet.id).catch(() => {
      // A remoção local acontece mesmo se o Mongo estiver temporariamente indisponível.
    });

    if (sheets.length === 1) {
      const sheet = createSheet();
      setSheets([sheet]);
      setActiveId(sheet.id);
      setSummaryVersionId('');
      setActiveTab('identity');
      return;
    }
    const remaining = sheets.filter((sheet) => sheet.id !== activeSheet.id);
    setSheets(remaining);
    openSheet(remaining[0]);
  }

  function exportSheet() {
    const payload = JSON.stringify({ ...activeSheet, calculated: { baseAttackBonus, defenses } }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${activeSheet.characterName.toLowerCase().replace(/\s+/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function saveSheetVersion(summary: string, options: { finalized?: boolean } = {}) {
    updateActiveSheet((sheet) => {
      const version: SheetVersion = {
        id: crypto.randomUUID(),
        versionNumber: (sheet.sheetVersions?.length ?? 0) + 1,
        level: sheet.totalLevel,
        summary,
        createdAt: new Date().toISOString(),
        snapshot: buildSheetSnapshot(sheet),
      };

      return {
        ...sheet,
        sheetVersions: [version, ...(sheet.sheetVersions ?? [])],
        versionNote: summary,
        isFinalized: options.finalized ?? true,
      };
    });
  }

  function deleteSheetVersion(versionId: string) {
    const nextSheet: CharacterSheet = {
      ...activeSheet,
      sheetVersions: activeSheet.sheetVersions.filter((version) => version.id !== versionId),
      updatedAt: new Date().toISOString(),
    };

    setSheets((current) => current.map((sheet) => (sheet.id === activeSheet.id ? nextSheet : sheet)));
    if (summaryVersionId === versionId) {
      setSummaryVersionId('');
    }

    if (authUser) {
      void saveRemoteSheet(nextSheet).catch(() => {
        // O cache local continua sendo a fonte imediata se o Mongo falhar momentaneamente.
      });
    }
  }

  function startSheetEdition() {
    saveSheetVersion(activeSheet.versionNote || `Edição baseada no nível ${activeSheet.totalLevel}`, { finalized: false });
    setSummaryVersionId('');
    setLevelUpOpen(false);
    setActiveTab('identity');
  }

  async function applyLevelUp() {
    if (levelUpSaving) return;

    const classData = heroicClassCatalog.find((item) => item.slug === levelUpClassSlug) ?? activeClass;
    const nextLevel = activeSheet.totalLevel + 1;
    const classCurrentLevel = getClassLevel(activeSheet, classData.slug);
    const suggestedHp = dieMaximum(classData.hitDie) + modifier(composedAbilities.constitution.total);
    const hitPointGain = Math.max(1, levelUpHpGain || suggestedHp);
    const abilityBoosts = levelRequiresAbilityBoost(nextLevel) && levelUpAbilityOne !== levelUpAbilityTwo
      ? [levelUpAbilityOne, levelUpAbilityTwo]
      : [];
    const chosenTalent = levelUpTalentSlug ? talentDetailsCatalog.find((item) => item.slug === levelUpTalentSlug) : null;
    const chosenFeat = levelUpFeatSlug
      ? featCatalog.find((item) =>
        item.slug === levelUpFeatSlug &&
        !activeSheet.feats.includes(item.slug) &&
        classData.bonusFeats.some((featName) => matchesFeatName(item, featName)))
      : null;
    const summary = `Nível ${nextLevel}: ${classData.name} ${classCurrentLevel + 1}; PV +${hitPointGain}${chosenTalent ? `; talento ${chosenTalent.name}` : ''}${chosenFeat ? `; aptidão ${chosenFeat.name}` : ''}.`;
    const historyEntry: LevelHistoryEntry = {
      id: crypto.randomUUID(),
      level: nextLevel,
      classSlug: classData.slug,
      hitPointGain,
      talentSlug: levelUpTalentSlug,
      featSlug: chosenFeat?.slug ?? '',
      abilityBoosts,
      notes: levelUpNotes,
      createdAt: new Date().toISOString(),
    };

    const nextClassLevels = activeSheet.classLevels.some((entry) => entry.classSlug === classData.slug)
      ? activeSheet.classLevels.map((entry) => (entry.classSlug === classData.slug ? { ...entry, level: entry.level + 1 } : entry))
      : [...activeSheet.classLevels, { classSlug: classData.slug, level: 1 }];
    const nextAbilities = abilityBoosts.reduce(
      (abilities, ability) => ({ ...abilities, [ability]: abilities[ability] + 1 }),
      activeSheet.abilities,
    );
    const nextSheet: CharacterSheet = {
      ...activeSheet,
      classSlug: classData.slug,
      classLevels: nextClassLevels,
      totalLevel: nextLevel,
      heroicLevel: nextLevel,
      abilities: nextAbilities,
      hitPointsMaximum: activeSheet.hitPointsMaximum + hitPointGain,
      hitPointsCurrent: activeSheet.hitPointsCurrent + hitPointGain,
      forcePoints: forcePointsForLevel(nextLevel),
      destinyPoints: destinyPointsForLevel(nextLevel),
      feats: chosenFeat ? [...activeSheet.feats, chosenFeat.slug] : activeSheet.feats,
      talents: levelUpTalentSlug && !activeSheet.talents.includes(levelUpTalentSlug) ? [...activeSheet.talents, levelUpTalentSlug] : activeSheet.talents,
      progressionLog: [activeSheet.progressionLog, summary, levelUpNotes].filter(Boolean).join('\n'),
      levelHistory: [historyEntry, ...(activeSheet.levelHistory ?? [])],
      versionNote: summary,
      isFinalized: true,
    };
    const version: SheetVersion = {
      id: crypto.randomUUID(),
      versionNumber: (activeSheet.sheetVersions?.length ?? 0) + 1,
      level: nextLevel,
      summary,
      createdAt: new Date().toISOString(),
      snapshot: buildSheetSnapshot(nextSheet),
    };
    const persistedSheet: CharacterSheet = {
      ...nextSheet,
      sheetVersions: [version, ...(activeSheet.sheetVersions ?? [])],
      updatedAt: new Date().toISOString(),
    };

    setLevelUpSaving(true);
    setLevelUpSaveError('');

    try {
      setSheets((current) => current.map((sheet) => (sheet.id === activeSheet.id ? persistedSheet : sheet)));
      await saveRemoteSheet(persistedSheet);
    } catch (error) {
      setLevelUpSaveError(error instanceof Error ? error.message : 'Não foi possível salvar o level up no Mongo.');
      setLevelUpSaving(false);
      return;
    }

    setLevelUpHpGain(0);
    setLevelUpTalentSlug('');
    setLevelUpFeatSlug('');
    setLevelUpNotes('');
    setLevelUpSaving(false);
    setLevelUpOpen(false);
    setSummaryVersionId(version.id);
    setActiveTab('summary');
  }

  function loginWithGoogle() {
    window.location.href = apiUrl('/api/auth/google/start');
  }

  async function logout() {
    await logoutRemoteSession();
    setAuthUser(null);
    setRemoteLoaded(false);
  }

  function goToPreviousStep() {
    if (!isFirstStep) {
      setActiveTab(sheetTabs[activeStepIndex - 1].id);
    }
  }

  function goToNextStep() {
    if (!isLastStep) {
      const nextTab = sheetTabs[activeStepIndex + 1].id;
      if (nextTab === 'summary') {
        updateActiveSheet((sheet) => ({ ...sheet, isFinalized: true }));
      }
      setActiveTab(nextTab);
    }
  }

  if (isWikiRoute) {
    return <WikiApp authLoaded={authLoaded} authUser={authUser} onLogin={loginWithGoogle} onLogout={logout} />;
  }

  if (!authLoaded) {
    return (
      <main className="auth-shell">
        <div className="auth-panel">
          <Dice5 aria-hidden="true" />
          <span>RPG Builder</span>
          <h1>Carregando sessão</h1>
          <p>Conferindo seu login antes de abrir suas fichas.</p>
        </div>
      </main>
    );
  }

  if (!authUser) {
    return (
      <main className="auth-shell">
        <div className="auth-panel">
          <Dice5 aria-hidden="true" />
          <span>RPG Builder</span>
          <h1>Entre para criar fichas</h1>
          <p>Suas fichas ficam salvas no Mongo e separadas pela sua conta Google.</p>
          {authError && <p className="auth-error">{authError}</p>}
          <button className="google-login-button" type="button" onClick={loginWithGoogle}>
            Entrar com Google
          </button>
          <button className="secondary-auth-button" type="button" onClick={() => { window.location.href = '/wiki/star-wars-saga'; }}>
            Consultar wiki pública
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Dice5 aria-hidden="true" />
          <div>
            <span>RPG Builder</span>
            <strong>Saga Edition</strong>
          </div>
        </div>

        <div className="account-card">
          <GoogleAccountAvatar user={authUser} />
          <div>
            <span>{authUser.name}</span>
            <small>{authUser.email}</small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          <button className="active" type="button" onClick={() => { window.location.href = '/app'; }}>
            Fichas
          </button>
          <button type="button" onClick={() => { window.location.href = '/wiki/star-wars-saga'; }}>
            Wiki Star Wars
          </button>
        </nav>

        <button className="primary-action" type="button" onClick={addSheet}>
          <FilePlus2 aria-hidden="true" />
          Nova ficha
        </button>

        <div className="sheet-list" aria-label="Fichas salvas">
          {sheets.map((sheet) => (
            <button className={sheet.id === activeSheet.id ? 'sheet-card active' : 'sheet-card'} key={sheet.id} type="button" onClick={() => openSheet(sheet)}>
              <span>{sheet.characterName}</span>
              <small>
                {labelFor(speciesCatalog, sheet.speciesSlug)} · {formatDate(sheet.updatedAt)}
              </small>
            </button>
          ))}
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>Editor de ficha Star Wars Saga</p>
            <h1>{activeSheet.characterName}</h1>
          </div>
          <div className="toolbar">
            <button type="button" onClick={duplicateSheet} title="Duplicar ficha"><Copy aria-hidden="true" /></button>
            <button type="button" onClick={exportSheet} title="Exportar JSON"><Download aria-hidden="true" /></button>
            <button type="button" onClick={deleteSheet} title="Excluir ficha"><Trash2 aria-hidden="true" /></button>
            <button type="button" onClick={logout} title="Sair"><LogOut aria-hidden="true" /></button>
          </div>
        </header>

        <section className="summary-band">
          <div><UserRound aria-hidden="true" /><span>{labelFor(speciesCatalog, activeSheet.speciesSlug)}</span></div>
          <div><Swords aria-hidden="true" /><span>{labelFor(heroicClassCatalog, activeSheet.classSlug)} nível {activeSheet.totalLevel}</span></div>
          <div><Shield aria-hidden="true" /><span>Ref {defenses.reflex} Fort {defenses.fortitude} Von {defenses.will}</span></div>
          <div><CircleDot aria-hidden="true" /><span>BBA +{baseAttackBonus}</span></div>
        </section>

        <CharacterPortraitShowcase sheet={activeSheet} />

        <CharacterDashboard />

        {levelUpOpen && (
          <div className="level-up-panel-wrap">
            <LevelUpPanel />
          </div>
        )}

        {activeTab !== 'summary' && (
          <section className="creation-flow" aria-label="Progresso da criação da ficha">
            <div className="flow-heading">
              <div>
                <p>Passo {activeStepIndex + 1} de {sheetTabs.length}</p>
                <h2>{activeStep.label}</h2>
              </div>
              <div className="flow-heading-actions">
                <span>{Math.round(progressPercent)}%</span>
                <StepControls compact />
              </div>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${progressPercent}%` }} />
            </div>
          </section>
        )}

        <div className="grid">
          {activeTab === 'identity' && (
            <Panel icon={<BookOpen aria-hidden="true" />} title="Identidade">
              <div className="form-grid">
                <TextInput label="Nome" value={activeSheet.characterName} onChange={(value) => setField('characterName', value)} />
                <TextInput label="Jogador" value={activeSheet.playerName} onChange={(value) => setField('playerName', value)} />
                <TextInput label="Campanha" value={activeSheet.campaignName} onChange={(value) => setField('campaignName', value)} />
                <label>Era<select value={activeSheet.era} onChange={(event) => setField('era', event.target.value as CharacterSheet['era'])}>{eras.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <TextInput label="Destino" value={activeSheet.destiny} onChange={(value) => setField('destiny', value)} />
                <TextInput label="Gênero" value={activeSheet.gender} onChange={(value) => setField('gender', value)} />
                <TextInput label="Idade" value={activeSheet.age} onChange={(value) => setField('age', value)} />
                <TextInput label="Altura" value={activeSheet.height} onChange={(value) => setField('height', value)} />
                <TextInput label="Peso" value={activeSheet.weight} onChange={(value) => setField('weight', value)} />
                <TextInput label="Olhos" value={activeSheet.eyes} onChange={(value) => setField('eyes', value)} />
                <TextInput label="Cabelo" value={activeSheet.hair} onChange={(value) => setField('hair', value)} />
                <TextInput label="Pele" value={activeSheet.skin} onChange={(value) => setField('skin', value)} />
                <TextInput label="Mundo natal" value={activeSheet.homeworld} onChange={(value) => setField('homeworld', value)} />
                <TextInput label="Idiomas" value={activeSheet.languages} onChange={(value) => setField('languages', value)} />
                <TextInput label="URL do retrato" value={activeSheet.portraitUrl} onChange={(value) => setField('portraitUrl', value)} />
              </div>
            </Panel>
          )}

          {activeTab === 'species' && (
            <Panel icon={<UserRound aria-hidden="true" />} title="Espécie e classes">
              <div className="form-grid">
                <CatalogSelect label="Espécie" value={activeSheet.speciesSlug} items={speciesCatalog} onChange={setSpeciesSlug} />
                <CatalogSelect label="Classe heroica" value={activeSheet.classSlug} items={heroicClassCatalog} onChange={setClassSlug} />
                <NumberInput label="Nível total" value={activeSheet.totalLevel} min={1} onChange={(value) => setField('totalLevel', value)} />
                <NumberInput label="Nível heroico" value={activeSheet.heroicLevel} min={0} onChange={(value) => setField('heroicLevel', value)} />
                <NumberInput label="Nível prestígio" value={activeSheet.prestigeLevel} min={0} onChange={(value) => setField('prestigeLevel', value)} />
                <NumberInput label="Deslocamento" value={activeSheet.speed} min={0} onChange={(value) => setField('speed', value)} />
              </div>
              <div className="source-details">
                <div className="detail-box species-source">
                  <strong><WikiLink slug={activeSpecies.slug}>{activeSpecies.name}</WikiLink></strong>
                  <p>{activeSpecies.description}</p>
                  <small>{activeSpecies.size}, deslocamento racial {activeSpecies.speed}</small>
                  <small>Tracos: {activeSpecies.traits.join(', ')}</small>
                </div>
                <div className="detail-box class-source">
                  <strong><WikiLink slug={activeClass.slug}>{activeClass.name}</WikiLink></strong>
                  <p>{activeClass.description}</p>
                  <small>Papel: {activeClass.role}</small>
                  <small>Perícias treinadas: {activeClass.trainedSkillBase} + Int</small>
                  <small>Árvores: {activeClass.talentTrees.join(', ')}</small>
                  <small>Aptidões iniciais: {activeClass.startingFeats.join(', ')}</small>
                </div>
              </div>
              <div className="level-track">
                {activeSheet.classLevels.map((entry) => (
                  <span key={entry.classSlug}>{labelFor(heroicClassCatalog, entry.classSlug)} {entry.level}</span>
                ))}
              </div>
            </Panel>
          )}

          {activeTab === 'abilities' && (
            <Panel icon={<BadgePlus aria-hidden="true" />} title="Atributos">
              <div className="characteristics">
                {(Object.keys(activeSheet.abilities) as AbilityKey[]).map((key) => (
                  <label className="stepper ability-stepper" key={key}>
                    <span>{abilityLabels[key]} <small>mod {modifier(composedAbilities[key].total) >= 0 ? '+' : ''}{modifier(composedAbilities[key].total)}</small></span>
                    <input min="1" type="number" value={activeSheet.abilities[key]} onChange={(event) => updateActiveSheet((sheet) => ({ ...sheet, abilities: { ...sheet.abilities, [key]: Number(event.target.value) } }))} />
                    <div className="formula-strip">
                      <b className="base-source">{composedAbilities[key].base}</b>
                      <b className="species-source">{signed(composedAbilities[key].species)}</b>
                      <b>{composedAbilities[key].total}</b>
                    </div>
                  </label>
                ))}
              </div>
              <SourceLegend />
            </Panel>
          )}

          {activeTab === 'combat' && (
            <Panel icon={<Shield aria-hidden="true" />} title="Combate">
              <div className="condition-grid">
                <NumberInput label="PV atual" value={activeSheet.hitPointsCurrent} min={0} onChange={(value) => setField('hitPointsCurrent', value)} />
                <NumberInput label="PV máximo" value={activeSheet.hitPointsMaximum} min={0} onChange={(value) => setField('hitPointsMaximum', value)} />
                <NumberInput label="PV temporários" value={activeSheet.hitPointsTemporary} min={0} onChange={(value) => setField('hitPointsTemporary', value)} />
                <NumberInput label="Dano recebido" value={activeSheet.damageTaken} min={0} onChange={(value) => setField('damageTaken', value)} />
                <NumberInput label="Marcador de condição" value={activeSheet.conditionStep} min={-5} onChange={(value) => setField('conditionStep', value)} />
                <NumberInput label="Pontos de destino" value={activeSheet.destinyPoints} min={0} onChange={(value) => setField('destinyPoints', value)} />
                <NumberInput label="Pontos da Força" value={activeSheet.forcePoints} min={0} onChange={(value) => setField('forcePoints', value)} />
                <NumberInput label="Lado Negro" value={activeSheet.darkSideScore} min={0} onChange={(value) => setField('darkSideScore', value)} />
              </div>
              <div className="defense-breakdown">
                {(['reflex', 'fortitude', 'will'] as DefenseKey[]).map((key) => (
                  <div className="defense-card" key={key}>
                    <strong>{key === 'reflex' ? 'Reflexos' : key === 'fortitude' ? 'Fortitude' : 'Vontade'} {defenses[key]}</strong>
                    <div className="formula-strip">
                      <b className="base-source">10</b>
                      <b className="base-source">Nv {activeSheet.totalLevel}</b>
                      <b className="base-source">Hab {signed(defenseBreakdown[key].ability)}</b>
                      <b className="species-source">Raça {signed(defenseBreakdown[key].species)}</b>
                      <b className="class-source">Classe {signed(defenseBreakdown[key].class)}</b>
                    </div>
                  </div>
                ))}
                <div className="detail-box class-source">
                  <strong>PV inicial sugerido {expectedStartingHitPoints}</strong>
                  <p>{activeClass.startingHitPoints} da classe + modificador de Constituição final.</p>
                </div>
              </div>
              <SourceLegend />
            </Panel>
          )}

          {activeTab === 'skills' && (
            <Panel className="skills-panel-full" icon={<Dice5 aria-hidden="true" />} title="Perícias">
              <div className="skill-rule-note">
                <strong>Conhecimento Comum</strong>
                <p>Você pode responder uma pergunta simples sobre um tema relacionado à sua área de estudo com um teste CD 10.</p>
              </div>
              <div className="skills-table skill-grid-table">
                <div className="skill-header">
                  <span>Nome da perícia</span>
                  <span>Bônus de perícia</span>
                  <span>1/2 nível + habilidade</span>
                  <span>Treinamento</span>
                  <span>Foco em perícia</span>
                  <span>Outros</span>
                </div>
                {activeSheet.skills.map((skill) => {
                  const {
                    ability,
                    abilityModifier,
                    catalog,
                    focusBonus,
                    halfLevelBonus,
                    levelAndAbilityBonus,
                    otherBonus,
                    speciesSkillBonus,
                    total,
                    trainingBonus,
                  } = calculateSkillBreakdown(activeSheet, activeSpecies, composedAbilities, skill);
                  return (
                    <div className="skill-row" key={skill.skillSlug}>
                      <label className="career-toggle skill-check skill-training" title="Treinada"><input checked={skill.trained} type="checkbox" onChange={(event) => updateSkill(skill.skillSlug, { trained: event.target.checked })} /><span>{signed(trainingBonus)}</span></label>
                      <div>
                        <strong><WikiLink slug={skill.skillSlug}>{catalog?.name ?? skill.skillSlug}</WikiLink></strong>
                        <small>{abilityLabels[ability]}{catalog?.armor ? ' - penalidade de armadura' : ''}</small>
                        {catalog?.description && <small className="skill-description">{catalog.description}</small>}
                      </div>
                      <label className="career-toggle skill-check skill-focus" title="Foco"><input checked={skill.focused} type="checkbox" onChange={(event) => updateSkill(skill.skillSlug, { focused: event.target.checked })} /><span>{signed(focusBonus)}</span></label>
                      <span className="dice-pool skill-total-cell">{signed(total)}</span>
                      <div className="formula-strip skill-formula">
                        <b className="base-source">Nv {signed(halfLevelBonus)}</b>
                        <b className="base-source">{abilityLabels[ability]} {signed(abilityModifier)}</b>
                        <b>{signed(levelAndAbilityBonus)}</b>
                      </div>
                      <div className="other-bonus-cell">
                        <input aria-label={`Outros bônus de ${catalog?.name}`} type="number" value={skill.misc} onChange={(event) => updateSkill(skill.skillSlug, { misc: Number(event.target.value) })} />
                        <small>Total outros {signed(otherBonus)}</small>
                      </div>
                      {speciesSkillBonus !== 0 && <small className="species-note">Raça {signed(speciesSkillBonus)}</small>}
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          {activeTab === 'feats' && <FeatsPanel />}
          {activeTab === 'talents' && <TalentsPanel />}
          {activeTab === 'force' && <ForcePanel />}
          {activeTab === 'equipment' && <GroupedRichSelectionPanel icon={<Package aria-hidden="true" />} title="Equipamentos" groupLabel="Subdivisão" itemLabel="Equipamento" items={equipmentDetailsCatalog} selected={activeSheet.inventory} onChange={(value) => setField('inventory', value)} />}
          {activeTab === 'vehicles' && <GroupedRichSelectionPanel icon={<Car aria-hidden="true" />} title="Veículos" groupLabel="Subdivisão" itemLabel="Veículo" items={vehicleDetailsCatalog} selected={activeSheet.vehicles} onChange={(value) => setField('vehicles', value)} />}
          {activeTab === 'droids' && <DroidsPanel />}
          {activeTab === 'notes' && (
            <Panel icon={<Save aria-hidden="true" />} title="Anotações">
              <textarea value={activeSheet.notes} onChange={(event) => setField('notes', event.target.value)} />
            </Panel>
          )}
          {activeTab === 'history' && <HistoryPanel />}
          {activeTab === 'versions' && <VersionsPanel />}
          {activeTab === 'summary' && <SummaryPanel />}
        </div>

        {activeTab !== 'summary' && (
          <footer className="flow-controls">
            <StepControls />
          </footer>
        )}
      </section>
    </main>
  );

  function CharacterPortraitShowcase({ sheet }: { sheet: CharacterSheet }) {
    const isUploading = portraitUploadingId === sheet.id;

    return (
      <section className="character-portrait-showcase">
        <div className="character-portrait-art">
          {sheet.portraitUrl ? <img alt="" src={sheet.portraitUrl} /> : <UserRound aria-hidden="true" />}
        </div>
        <div className="character-portrait-copy">
          <p>Retrato do personagem</p>
          <h2>{sheet.characterName}</h2>
          <div className="character-portrait-facts">
            <span>{labelFor(speciesCatalog, sheet.speciesSlug)}</span>
            <span>{labelFor(heroicClassCatalog, sheet.classSlug)} nível {sheet.totalLevel}</span>
            <span>BBA +{baseAttackBonus}</span>
          </div>
          <label className="portrait-file">
            {isUploading ? 'Enviando...' : sheet.portraitUrl ? 'Trocar imagem' : 'Enviar retrato'}
            <input
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={isUploading}
              type="file"
              onChange={(event) => {
                void handlePortraitUpload(sheet.id, event.target.files?.[0] ?? null);
                event.currentTarget.value = '';
              }}
            />
          </label>
          <button className="level-up-entry-button" type="button" onClick={() => setLevelUpOpen((open) => !open)}>
            {levelUpOpen ? 'Fechar level up' : 'Subir nível'}
          </button>
          {portraitError && <small className="portrait-error">{portraitError}</small>}
        </div>
      </section>
    );
  }

  function PortraitUploader({ sheet }: { sheet: CharacterSheet }) {
    const isUploading = portraitUploadingId === sheet.id;

    return (
      <section className="portrait-uploader">
        <div className="portrait-frame">
          {sheet.portraitUrl ? <img alt="" src={sheet.portraitUrl} /> : <UserRound aria-hidden="true" />}
        </div>
        <div>
          <strong>Retrato do personagem</strong>
          <p>A imagem fica salva no Blob e vinculada ao personagem, não a uma versão específica da ficha.</p>
          <label className="portrait-file">
            {isUploading ? 'Enviando...' : 'Enviar imagem'}
            <input
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={isUploading}
              type="file"
              onChange={(event) => {
                void handlePortraitUpload(sheet.id, event.target.files?.[0] ?? null);
                event.currentTarget.value = '';
              }}
            />
          </label>
          {sheet.portraitBlobPath && <small>Blob: {sheet.portraitBlobPath}</small>}
          {portraitError && <small className="portrait-error">{portraitError}</small>}
        </div>
      </section>
    );
  }

  function CharacterDashboard() {
    const sortedSheets = [...sheets].sort((left, right) => left.characterName.localeCompare(right.characterName, 'pt-BR'));

    return (
      <section className="character-dashboard" aria-label="Personagens">
        <div className="dashboard-heading">
          <div>
            <p>Área logada</p>
            <h2>Personagens</h2>
          </div>
          <button type="button" onClick={addSheet}>Novo personagem</button>
        </div>
        <div className="character-card-grid">
          {sortedSheets.map((sheet) => {
            const sheetSpecies = labelFor(speciesCatalog, sheet.speciesSlug);
            const classSummary = sheet.classLevels.map((entry) => `${labelFor(heroicClassCatalog, entry.classSlug)} ${entry.level}`).join(' / ');
            const versions = sheet.sheetVersions.length > 0
              ? sheet.sheetVersions
              : [{
                id: `${sheet.id}-current`,
                versionNumber: 0,
                level: sheet.totalLevel,
                summary: 'Ficha atual ainda sem versão publicada.',
                createdAt: sheet.updatedAt,
                snapshot: buildSheetSnapshot(sheet),
              } satisfies SheetVersion];

            return (
              <article className={sheet.id === activeSheet.id ? 'character-card active' : 'character-card'} key={sheet.id}>
                <div className="character-card-top">
                  <button className="character-portrait-button" type="button" onClick={() => openSheet(sheet)}>
                    {sheet.portraitUrl ? <img alt="" src={sheet.portraitUrl} /> : <UserRound aria-hidden="true" />}
                  </button>
                  <div>
                    <strong>{sheet.characterName}</strong>
                    <span>{sheetSpecies} · nível {sheet.totalLevel}</span>
                    <small>{classSummary}</small>
                  </div>
                </div>
                <div className="character-actions">
                  <button type="button" onClick={() => openSheet(sheet)}>{sheet.isFinalized ? 'Ver resumo' : 'Editar personagem'}</button>
                  <label>
                    {portraitUploadingId === sheet.id ? 'Enviando...' : 'Retrato'}
                    <input
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      disabled={portraitUploadingId === sheet.id}
                      type="file"
                      onChange={(event) => {
                        void handlePortraitUpload(sheet.id, event.target.files?.[0] ?? null);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                </div>
                <div className="character-version-accordion">
                  {versions.map((version) => {
                    const snapshot = version.snapshot as Partial<CharacterSheet>;
                    const versionClasses = snapshot.classLevels?.map((entry) => `${labelFor(heroicClassCatalog, entry.classSlug)} ${entry.level}`).join(' / ') || classSummary;

                    return (
                      <details key={version.id}>
                        <summary>
                          <span>{version.versionNumber > 0 ? `Versão ${version.versionNumber}` : 'Ficha atual'}</span>
                          <b>Nível {version.level}</b>
                        </summary>
                        <div className="character-version-details">
                          <p>{version.summary}</p>
                          <span>Classes: {versionClasses}</span>
                          <span>Espécie: {labelFor(speciesCatalog, snapshot.speciesSlug ?? sheet.speciesSlug)}</span>
                          <span>PV: {snapshot.hitPointsCurrent ?? sheet.hitPointsCurrent}/{snapshot.hitPointsMaximum ?? sheet.hitPointsMaximum}</span>
                          <span>Salva em {formatDate(version.createdAt)}</span>
                          <button type="button" onClick={() => viewSheetVersion(sheet, version.versionNumber > 0 ? version.id : '')}>
                            Ver no resumo
                          </button>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
        {portraitError && <p className="portrait-error dashboard-error">{portraitError}</p>}
      </section>
    );
  }

  function StepControls({ compact = false }: { compact?: boolean }) {
    return (
      <div className={compact ? 'step-controls compact' : 'step-controls'}>
        <button type="button" onClick={goToPreviousStep} disabled={isFirstStep}>
          <ChevronLeft aria-hidden="true" />
          Voltar
        </button>
        <button className="next-step" type="button" onClick={goToNextStep} disabled={isLastStep}>
          {isLastStep ? <CheckCircle2 aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
          {isLastStep ? 'Resumo aberto' : 'Próximo'}
        </button>
      </div>
    );
  }

  function LevelUpPanel() {
    const nextLevel = activeSheet.totalLevel + 1;
    const selectedClass = heroicClassCatalog.find((item) => item.slug === levelUpClassSlug) ?? activeClass;
    const nextClassLevel = getClassLevel(activeSheet, selectedClass.slug) + 1;
    const suggestedHp = Math.max(1, dieMaximum(selectedClass.hitDie) + modifier(composedAbilities.constitution.total));
    const levelUpForceSensitive = activeSheet.forceSensitivity || activeSheet.feats.includes('sensivel-a-forca');
    // Sensível à Força pode escolher um talento da Força no lugar do talento de classe (Manual, p. 110).
    const classTalents = [
      ...talentDetailsCatalog.filter((item) => item.classRestriction?.includes(selectedClass.slug)),
      ...(levelUpForceSensitive ? forceTalentDetailsCatalog : []),
    ];
    const selectedClassBonusFeats = featCatalog.filter((item) =>
      !activeSheet.feats.includes(item.slug) &&
      selectedClass.bonusFeats.some((featName) => matchesFeatName(item, featName)));
    const levelUpFeatValue = selectedClassBonusFeats.some((item) => item.slug === levelUpFeatSlug) ? levelUpFeatSlug : '';
    const gains = [
      `PV: máximo do ${selectedClass.hitDie} + Con. Sugestão: +${suggestedHp}`,
      `BBA após salvar: +${calculateBaseAttackFromClassLevels(
        activeSheet.classLevels.some((entry) => entry.classSlug === selectedClass.slug)
          ? activeSheet.classLevels.map((entry) => (entry.classSlug === selectedClass.slug ? { ...entry, level: entry.level + 1 } : entry))
          : [...activeSheet.classLevels, { classSlug: selectedClass.slug, level: 1 }],
      )}`,
      'Dano de todas as armas: +1',
      `Pontos da Força serão definidos como ${forcePointsForLevel(nextLevel)} (não acumula)`,
      `Pontos de Destino serão definidos como ${destinyPointsForLevel(nextLevel)} (não acumula)`,
      `${classProgressionGain(nextClassLevel)} em ${selectedClass.name}`,
      levelRequiresAbilityBoost(nextLevel) ? '+1 em dois atributos diferentes' : 'Sem aumento de atributo neste nível',
    ];

    return (
      <Panel className="wide-panel" icon={<ChevronRight aria-hidden="true" />} title={`Level up para o nível ${nextLevel}`}>
        <div className="level-up-layout">
          <section className="level-up-column">
            <h3>1. Classe que subiu</h3>
            <CatalogSelect label="Classe do novo nível" value={levelUpClassSlug} items={heroicClassCatalog} onChange={setLevelUpClassSlug} />
            <div className="detail-box class-source">
              <strong>{selectedClass.name} {nextClassLevel}</strong>
              <p>{selectedClass.description}</p>
              <small>Árvores: {selectedClass.talentTrees.join(', ')}</small>
              <small>{selectedClassBonusFeats.length} aptidões bônus disponíveis para esta classe.</small>
            </div>
          </section>

          <section className="level-up-column">
            <h3>2. Ganhos automáticos</h3>
            <div className="level-gain-list">
              {gains.map((gain) => <span key={gain}>{gain}</span>)}
            </div>
            <NumberInput label={`PV ganho (${selectedClass.hitDie} + Con)`} value={levelUpHpGain || suggestedHp} min={1} onChange={setLevelUpHpGain} />
            {levelRequiresAbilityBoost(nextLevel) && (
              <div className="form-grid">
                <AbilitySelect label="Atributo +1" value={levelUpAbilityOne} onChange={setLevelUpAbilityOne} />
                <AbilitySelect label="Outro atributo +1" value={levelUpAbilityTwo} onChange={setLevelUpAbilityTwo} />
              </div>
            )}
          </section>

          <section className="level-up-column">
            <h3>3. Escolhas</h3>
            {nextClassLevel % 2 === 1 ? (
              <LevelUpChoiceCards label="Escolha seu talento" type="talent" items={classTalents} value={levelUpTalentSlug} onChange={setLevelUpTalentSlug} />
            ) : (
              <LevelUpChoiceCards label="Escolha sua aptidão" type="feat" items={selectedClassBonusFeats} value={levelUpFeatValue} onChange={setLevelUpFeatSlug} />
            )}
            <textarea placeholder="Notas da progressão, rolagem de PV, justificativa narrativa..." value={levelUpNotes} onChange={(event) => setLevelUpNotes(event.target.value)} />
            {levelUpSaveError && <p className="level-up-save-error">{levelUpSaveError}</p>}
            <button className="commit-level-button" type="button" onClick={applyLevelUp} disabled={levelUpSaving}>
              {levelUpSaving ? 'Salvando no banco...' : 'Salvar level up e criar versão'}
            </button>
          </section>
        </div>
      </Panel>
    );
  }

  function shortRuleText(text = '', maxLength = 260) {
    return text
      .replace(/[#*_`|>-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength);
  }

  function renderChoiceHighlight(text = '') {
    const pattern = /([+-]\d+(?:d\d+)?(?:\s*(?:de\s*)?(?:dano|bônus|penalidade))?|\b\d+d\d+(?:[+-]\d+)?\b|\b(?:dano|bônus|penalidade|ação rápida|ação livre|ação padrão|reação|Defesa de Reflexos|Defesa de Fortitude|Defesa de Vontade|ataque|acerto|sucesso decisivo|Ponto da Força|Pontos da Força)\b)/gi;

    return text.split(pattern).map((part, index) => {
      if (!part) return null;
      if (part.match(pattern)) {
        return <b className="level-choice-highlight" key={`${part}-${index}`}>{part}</b>;
      }
      return part;
    });
  }

  function LevelUpChoiceCards({
    label,
    type,
    items,
    value,
    onChange,
  }: {
    label: string;
    type: 'talent' | 'feat';
    items: Array<DetailCatalogItem | FeatCatalogItem>;
    value: string;
    onChange: (value: string) => void;
  }) {
    if (items.length === 0) {
      return <p className="summary-empty">Nenhuma opção disponível para esta escolha.</p>;
    }

    const selectedItem = items.find((item) => item.slug === value);
    const changeLabel = type === 'feat' ? 'Alterar aptidão' : 'Alterar talento';

    function renderChoiceCard(item: DetailCatalogItem | FeatCatalogItem, locked = false) {
      const selected = value === item.slug;
      const feat = item as FeatCatalogItem;
      const detail = item as DetailCatalogItem;
      const description = type === 'feat'
        ? feat.benefit
        : detail.summary || shortRuleText(detail.details, 220);
      const meta = type === 'feat'
        ? `Pré-requisito: ${feat.prerequisites || 'Nenhum'}`
        : [detail.category, detail.classRestriction?.map((slug) => labelFor(heroicClassCatalog, slug)).join(', ')].filter(Boolean).join(' · ');
      const normal = type === 'feat' ? feat.normal : '';
      const special = type === 'feat' ? feat.special : '';

      return (
        <button
          className={[selected ? 'level-choice-card selected' : 'level-choice-card', locked ? 'locked' : ''].filter(Boolean).join(' ')}
          key={item.slug}
          type="button"
          onClick={() => {
            if (!locked) onChange(selected ? '' : item.slug);
          }}
        >
          <span className="level-choice-check" aria-hidden="true">
            <input checked={selected} readOnly type="checkbox" />
          </span>
          <span className="level-choice-content">
            <strong><WikiLink slug={item.slug}>{item.name}</WikiLink></strong>
            {meta && <small className="level-choice-meta">{meta}</small>}
            <p className={type === 'feat' ? 'level-choice-description full-text' : 'level-choice-description'}>{renderChoiceHighlight(description || 'Detalhes pendentes de catalogação.')}</p>
            {normal && <small className="level-choice-extra full-text"><b>Normal:</b> {renderChoiceHighlight(normal)}</small>}
            {special && <small className="level-choice-extra full-text"><b>Especial:</b> {renderChoiceHighlight(special)}</small>}
            {type === 'feat' && item.slug === 'treinamento-em-pericia' && (
              <small className="level-choice-action-note">
                Depois de salvar ou antes de finalizar, abra a etapa de Perícias e marque uma nova perícia de classe como treinada.
              </small>
            )}
            {type === 'talent' && detail.details && <small className="level-choice-extra">{renderChoiceHighlight(shortRuleText(detail.details, 160))}</small>}
          </span>
        </button>
      );
    }

    return (
      <div className="level-choice-field">
        <strong>{label}</strong>
        {selectedItem ? (
          <div className="level-choice-selected">
            {renderChoiceCard(selectedItem, true)}
            <button className="level-choice-change" type="button" onClick={() => onChange('')}>
              {changeLabel}
            </button>
          </div>
        ) : (
          <div className="level-choice-card-list">
            {items.map((item) => renderChoiceCard(item))}
          </div>
        )}
      </div>
    );
  }

  function AbilitySelect({ label, value, onChange }: { label: string; value: AbilityKey; onChange: (value: AbilityKey) => void }) {
    return (
      <label>
        {label}
        <select value={value} onChange={(event) => onChange(event.target.value as AbilityKey)}>
          {(Object.keys(abilityLabels) as AbilityKey[]).map((key) => <option key={key} value={key}>{abilityLabels[key]}</option>)}
        </select>
      </label>
    );
  }

  function HistoryPanel() {
    return (
      <Panel className="wide-panel" icon={<Save aria-hidden="true" />} title="Histórico de progressão">
        <textarea value={activeSheet.progressionLog} onChange={(event) => setField('progressionLog', event.target.value)} />
        <div className="version-list">
          {activeSheet.levelHistory.length === 0 && <p className="summary-empty">Nenhum level up salvo ainda.</p>}
          {activeSheet.levelHistory.map((entry) => (
            <article className="version-card" key={entry.id}>
              <strong>Nível {entry.level}: {labelFor(heroicClassCatalog, entry.classSlug)}</strong>
              <span>PV +{entry.hitPointGain} · {formatDate(entry.createdAt)}</span>
              {entry.talentSlug && <a href={`/wiki/star-wars-saga/${entry.talentSlug}`}>Talento: {labelFor(talentDetailsCatalog, entry.talentSlug)}</a>}
              {entry.featSlug && <a href={`/wiki/star-wars-saga/${entry.featSlug}`}>Aptidão: {labelFor(featCatalog, entry.featSlug)}</a>}
              {entry.abilityBoosts.length > 0 && <span>Atributos: {entry.abilityBoosts.map((key) => abilityLabels[key]).join(', ')}</span>}
              {entry.notes && <p>{entry.notes}</p>}
            </article>
          ))}
        </div>
      </Panel>
    );
  }

  function VersionsPanel() {
    return (
      <Panel className="wide-panel" icon={<Save aria-hidden="true" />} title="Versões da ficha">
        <div className="feat-picker">
          <label>
            Resumo da versão manual
            <input value={activeSheet.versionNote} onChange={(event) => setField('versionNote', event.target.value)} />
          </label>
          <button type="button" onClick={() => saveSheetVersion(activeSheet.versionNote || `Versão nível ${activeSheet.totalLevel}`)}>Criar versão</button>
        </div>
        <div className="version-list">
          {activeSheet.sheetVersions.length === 0 && <p className="summary-empty">Nenhuma versão salva ainda. Use o level up ou crie uma versão manual.</p>}
          {activeSheet.sheetVersions.map((version) => (
            <article className={summaryVersionId === version.id ? 'version-card active' : 'version-card'} key={version.id}>
              <button className="version-card-main" type="button" onClick={() => viewSheetVersion(activeSheet, version.id)}>
                <strong>v{version.versionNumber} · nível {version.level}</strong>
                <span>{formatDate(version.createdAt)}</span>
                <p>{version.summary}</p>
              </button>
              <button className="version-delete-button" type="button" onClick={() => deleteSheetVersion(version.id)}>
                Excluir versão
              </button>
            </article>
          ))}
        </div>
      </Panel>
    );
  }

  function SummaryPanel() {
    const selectedVersion = activeSheet.sheetVersions.find((version) => version.id === summaryVersionId);
    const summarySheet = selectedVersion ? sheetFromVersion(selectedVersion) : activeSheet;
    const summarySpecies = speciesCatalog.find((item) => item.slug === summarySheet.speciesSlug) ?? speciesCatalog[0];
    const summaryClassDefenseBonuses = calculateClassDefenseBonuses(summarySheet.classLevels);
    const summaryAbilities = Object.fromEntries(
      (Object.keys(summarySheet.abilities) as AbilityKey[]).map((key) => [
        key,
        {
          base: summarySheet.abilities[key],
          species: summarySpecies.abilityModifiers[key],
          total: summarySheet.abilities[key] + summarySpecies.abilityModifiers[key],
        },
      ]),
    ) as Record<AbilityKey, { base: number; species: number; total: number }>;
    const summaryDefenseBreakdown = {
      reflex: {
        base: 10,
        heroic: summarySheet.totalLevel,
        ability: modifier(summaryAbilities.dexterity.total),
        species: summarySpecies.defenseBonuses.reflex,
        class: summaryClassDefenseBonuses.reflex,
      },
      fortitude: {
        base: 10,
        heroic: summarySheet.totalLevel,
        ability: modifier(summaryAbilities.constitution.total),
        species: summarySpecies.defenseBonuses.fortitude,
        class: summaryClassDefenseBonuses.fortitude,
      },
      will: {
        base: 10,
        heroic: summarySheet.totalLevel,
        ability: modifier(summaryAbilities.wisdom.total),
        species: summarySpecies.defenseBonuses.will,
        class: summaryClassDefenseBonuses.will,
      },
    };
    const summaryDefenses = Object.fromEntries(
      Object.entries(summaryDefenseBreakdown).map(([key, value]) => [
        key,
        value.base + value.heroic + value.ability + value.species + value.class,
      ]),
    ) as Record<DefenseKey, number>;
    const summaryBaseAttackBonus = calculateBaseAttackFromClassLevels(summarySheet.classLevels);
    const selectedFeats = summarySheet.feats.map((slug) => ({ label: labelFor(featCatalog, slug), slug }));
    const selectedTalents = summarySheet.talents.map((slug) => ({ label: labelFor(talentDetailsCatalog, slug), slug }));
    const selectedForcePowers = summarySheet.forcePowers.map((slug) => ({ label: `Poder: ${labelFor(forcePowerDetailsCatalog, slug)}`, slug }));
    const selectedForceTechniques = summarySheet.forceTechniques.map((slug) => ({ label: `Técnica: ${labelFor(forceTechniqueDetailsCatalog, slug)}`, slug }));
    const selectedForceSecrets = summarySheet.forceSecrets.map((slug) => ({ label: `Segredo: ${labelFor(forceSecretDetailsCatalog, slug)}`, slug }));
    const selectedEquipment = summarySheet.inventory.map((slug) => ({ label: labelFor(equipmentDetailsCatalog, slug), slug }));
    const selectedVehicles = summarySheet.vehicles.map((slug) => ({ label: labelFor(vehicleDetailsCatalog, slug), slug }));
    const droidCatalog = [...droidBuilderDetailsCatalog, ...readyDroidDetailsCatalog];
    const selectedDroids = summarySheet.droidSystems.map((slug) => ({ label: labelFor(droidCatalog, slug), slug }));
    const summarySkills = summarySheet.skills.map((skill) => {
      const breakdown = calculateSkillBreakdown(summarySheet, summarySpecies, summaryAbilities, skill);
      const tags = [
        `${abilityLabels[breakdown.ability]} ${signed(breakdown.abilityModifier)}`,
        `1/2 nível ${signed(breakdown.halfLevelBonus)}`,
        skill.trained ? 'treinada +5' : 'sem treino',
        skill.focused ? 'foco +5' : 'sem foco',
        breakdown.otherBonus !== 0 ? `outros ${signed(breakdown.otherBonus)}` : '',
      ].filter(Boolean);

      return {
        label: breakdown.catalog?.name ?? skill.skillSlug,
        slug: skill.skillSlug,
        meta: `${signed(breakdown.total)} · ${tags.join(' · ')}`,
      };
    });

    return (
      <Panel className="wide-panel summary-review" icon={<CheckCircle2 aria-hidden="true" />} title="Resumo da ficha">
        {activeSheet.sheetVersions.length > 0 && (
          <div className="summary-version-switcher" aria-label="Versão visualizada">
            <span>Visualizando</span>
            <button className={!selectedVersion ? 'active' : ''} type="button" onClick={() => setSummaryVersionId('')}>
              Ficha atual
            </button>
            {activeSheet.sheetVersions.map((version) => (
              <button
                className={selectedVersion?.id === version.id ? 'active' : ''}
                key={version.id}
                type="button"
                onClick={() => setSummaryVersionId(version.id)}
              >
                v{version.versionNumber} · nível {version.level}
              </button>
            ))}
          </div>
        )}
        <div className="summary-readonly-actions">
          <div>
            <strong>{selectedVersion ? `Versão ${selectedVersion.versionNumber} da ficha` : 'Ficha criada'}</strong>
            <p>{selectedVersion ? selectedVersion.summary : 'Este resumo é uma visualização fechada da ficha. Para alterar algo, crie uma nova edição ou use o level up.'}</p>
          </div>
          <div>
            <button type="button" onClick={startSheetEdition}>Criar nova edição</button>
            <button type="button" onClick={() => setLevelUpOpen(true)}>Fazer level up</button>
            {selectedVersion && <button className="delete-version-action" type="button" onClick={() => deleteSheetVersion(selectedVersion.id)}>Excluir versão</button>}
          </div>
        </div>
        <div className="summary-grid">
          <SummarySection title="Identidade" items={[
            ['Nome', summarySheet.characterName],
            ['Jogador', summarySheet.playerName],
            ['Campanha', summarySheet.campaignName],
            ['Era', eras.find(([value]) => value === summarySheet.era)?.[1] ?? summarySheet.era],
            ['Destino', summarySheet.destiny],
            ['Gênero', summarySheet.gender],
            ['Idade', summarySheet.age],
            ['Altura', summarySheet.height],
            ['Peso', summarySheet.weight],
            ['Olhos', summarySheet.eyes],
            ['Cabelo', summarySheet.hair],
            ['Pele', summarySheet.skin],
            ['Mundo natal', summarySheet.homeworld],
            ['Idiomas', summarySheet.languages],
            ['Retrato', summarySheet.portraitUrl],
          ]} />

          <SummarySection title="Espécie e classe" items={[
            ['Espécie', <WikiLink slug={summarySpecies.slug}>{summarySpecies.name}</WikiLink>],
            ['Classes', summarySheet.classLevels.map((entry) => (
              <span className="summary-inline-token" key={entry.classSlug}>
                <WikiLink slug={entry.classSlug}>{labelFor(heroicClassCatalog, entry.classSlug)} {entry.level}</WikiLink>
              </span>
            ))],
            ['Nível total', summarySheet.totalLevel],
            ['Nível heroico', summarySheet.heroicLevel],
            ['Nível prestígio', summarySheet.prestigeLevel],
            ['Deslocamento', summarySheet.speed],
            ['Versões salvas', activeSheet.sheetVersions.length],
          ]} />

          <SummarySection title="Atributos" items={(Object.keys(summarySheet.abilities) as AbilityKey[]).map((key) => [
            abilityLabels[key],
            `${summaryAbilities[key].total} (base ${summaryAbilities[key].base}, espécie ${signed(summaryAbilities[key].species)}, mod ${signed(modifier(summaryAbilities[key].total))})`,
          ])} />

          <SummarySection title="Combate" items={[
            ['PV atual', summarySheet.hitPointsCurrent],
            ['PV máximo', summarySheet.hitPointsMaximum],
            ['PV temporários', summarySheet.hitPointsTemporary],
            ['Dano recebido', summarySheet.damageTaken],
            ['Condição', summarySheet.conditionStep],
            ['Pontos de destino', summarySheet.destinyPoints],
            ['Pontos da Força', summarySheet.forcePoints],
            ['Lado Negro', summarySheet.darkSideScore],
            ['Reflexos', summaryDefenses.reflex],
            ['Fortitude', summaryDefenses.fortitude],
            ['Vontade', summaryDefenses.will],
            ['BBA', `+${summaryBaseAttackBonus}`],
          ]} />

          <SummaryList title="Perícias" items={summarySkills} empty="Nenhuma perícia cadastrada." detailed />
          <SummaryList title="Aptidões" items={selectedFeats} empty="Nenhuma aptidão adicionada." />
          <SummaryList title="Talentos" items={selectedTalents} empty="Nenhum talento adicionado." />
          <SummaryList title="Força" items={[
            summarySheet.forceSensitivity ? { label: 'Sensível à Força', slug: 'sensivel-a-forca' } : { label: 'Não sensível à Força' },
            summarySheet.forceTradition ? { label: `Tradição: ${labelFor(['Jedi', 'Sith', 'Bruxas de Dathomir', 'Jensaarai'].map(toCatalogItem), summarySheet.forceTradition)}` } : null,
            ...selectedForcePowers,
            ...selectedForceTechniques,
            ...selectedForceSecrets,
          ].filter((item): item is SummaryListItem => Boolean(item))} empty="Nenhuma informação da Força adicionada." />
          <SummaryList title="Equipamentos" items={selectedEquipment} empty="Nenhum equipamento adicionado." />
          <SummaryList title="Veículos" items={selectedVehicles} empty="Nenhum veículo adicionado." />
          <SummaryList title="Dróides" items={selectedDroids} empty="Nenhum dróide adicionado." />

          <SummaryText title="Anotações" value={summarySheet.notes} />
          <SummaryText title="Histórico" value={summarySheet.progressionLog} />
          <SummaryText title="Versões" value={summarySheet.versionNote} />
        </div>
      </Panel>
    );
  }

  function SummarySection({ title, items }: { title: string; items: Array<[string, ReactNode]> }) {
    return (
      <section className="summary-section">
        <h3>{title}</h3>
        <div className="summary-items">
          {items.map(([label, value]) => (
            <div className="summary-item" key={label}>
              <span>{label}</span>
              <strong>{value || 'Não preenchido'}</strong>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function SummaryList({ title, items, empty, detailed = false }: { title: string; items: SummaryListItem[]; empty: string; detailed?: boolean }) {
    return (
      <section className="summary-section">
        <h3>{title}</h3>
        {items.length > 0 ? (
          <div className={detailed ? 'summary-list detailed' : 'summary-list'}>
            {items.map((item) => (
              <span key={`${item.slug ?? item.label}-${item.meta ?? ''}`}>
                <WikiLink slug={item.slug}>{item.label}</WikiLink>
                {item.meta && <small>{item.meta}</small>}
              </span>
            ))}
          </div>
        ) : (
          <p className="summary-empty">{empty}</p>
        )}
      </section>
    );
  }

  function SummaryText({ title, value }: { title: string; value: string }) {
    return (
      <section className="summary-section summary-text">
        <h3>{title}</h3>
        <p>{value || 'Nada preenchido ainda.'}</p>
      </section>
    );
  }

  function updateSkill(skillSlug: string, patch: Partial<SkillEntry>) {
    updateActiveSheet((sheet) => ({
      ...sheet,
      skills: sheet.skills.map((skill) => (skill.skillSlug === skillSlug ? { ...skill, ...patch } : skill)),
    }));
  }

  function ForcePanel() {
    const useForceSkill = activeSheet.skills.find((skill) => skill.skillSlug === 'usar-a-forca');
    const halfLevelBonus = Math.floor(activeSheet.totalLevel / 2);
    const charismaModifier = modifier(composedAbilities.charisma.total);
    const trainingBonus = useForceSkill?.trained ? 5 : 0;
    const focusBonus = useForceSkill?.focused ? 5 : 0;
    const miscBonus = useForceSkill?.misc ?? 0;
    const useForceTotal = halfLevelBonus + charismaModifier + trainingBonus + focusBonus + miscBonus;
    const sensitivoFeatSlug = slugify('Sensitivo à Força');
    const treinamentoFeatSlug = slugify('Treinamento na Força');
    const hasSensitiveFeat = activeSheet.feats.includes(sensitivoFeatSlug);
    const hasTrainingFeat = activeSheet.feats.includes(treinamentoFeatSlug);
    const isActiveForceUser = activeSheet.forceSensitivity && Boolean(useForceSkill?.trained) && hasTrainingFeat && activeSheet.forcePowers.length > 0;
    const suggestedPowerSlots = hasTrainingFeat ? Math.max(1, 1 + modifier(composedAbilities.wisdom.total)) : 0;
    const darkSideState = activeSheet.darkSideScore <= 0 ? 'Equilibrado' : activeSheet.darkSideScore < 6 ? 'Sob influência' : 'Risco alto';

    function addForceFeat(slug: string) {
      if (!activeSheet.feats.includes(slug)) {
        setField('feats', [...activeSheet.feats, slug]);
      }

      if (slug === sensitivoFeatSlug) {
        setField('forceSensitivity', true);
      }
    }

    return (
      <Panel icon={<Sparkles aria-hidden="true" />} title="A Força">
        <div className="force-dashboard">
          <article className={isActiveForceUser ? 'force-card ready' : 'force-card'}>
            <span>Perfil</span>
            <strong>{isActiveForceUser ? 'Usuário ativo da Força' : activeSheet.forceSensitivity ? 'Sensível em treinamento' : 'Não iniciado'}</strong>
            <p>Para usar poderes normalmente, a ficha precisa de Sensível à Força, Usar a Força treinada e Treinamento na Força.</p>
          </article>
          <article className="force-card">
            <span>Usar a Força</span>
            <strong>{signed(useForceTotal)}</strong>
            <div className="formula-strip">
              <b className="base-source">Nv {signed(halfLevelBonus)}</b>
              <b className="base-source">Car {signed(charismaModifier)}</b>
              <b>{useForceSkill?.trained ? 'Treino +5' : 'Sem treino'}</b>
              <b>{useForceSkill?.focused ? 'Foco +5' : 'Sem foco'}</b>
              {miscBonus !== 0 && <b>{signed(miscBonus)} misc</b>}
            </div>
          </article>
          <article className="force-card">
            <span>Pontos da Força</span>
            <strong>{activeSheet.forcePoints}</strong>
            <p>Podem modificar jogadas, ativar talentos/segredos, recuperar poderes, remover condições e reforçar ataques.</p>
          </article>
          <article className={activeSheet.darkSideScore > 0 ? 'force-card dark' : 'force-card'}>
            <span>Lado Negro</span>
            <strong>{activeSheet.darkSideScore} · {darkSideState}</strong>
            <p>Medo, raiva, crueldade e uso egoísta da Força podem aumentar este valor.</p>
          </article>
        </div>

        <div className="force-setup">
          <div className="form-grid">
            <label className="toggle-line"><input checked={activeSheet.forceSensitivity} type="checkbox" onChange={(event) => setField('forceSensitivity', event.target.checked)} /> Sensível à Força</label>
            <CatalogSelect label="Tradição da Força" value={activeSheet.forceTradition} items={forceTraditionCatalog} onChange={(value) => setField('forceTradition', value)} />
            <NumberInput label="Pontos da Força" value={activeSheet.forcePoints} min={0} onChange={(value) => setField('forcePoints', value)} />
            <NumberInput label="Valor do Lado Negro" value={activeSheet.darkSideScore} min={0} onChange={(value) => setField('darkSideScore', value)} />
          </div>

          <div className="force-checklist">
            <div className={activeSheet.forceSensitivity || hasSensitiveFeat ? 'force-check complete' : 'force-check'}>
              <strong>Sensível à Força</strong>
              <p>Aptidão base para perceber e manipular a Força conscientemente.</p>
              {!hasSensitiveFeat && <button type="button" onClick={() => addForceFeat(sensitivoFeatSlug)}>Adicionar aptidão</button>}
            </div>
            <div className={useForceSkill?.trained ? 'force-check complete' : 'force-check'}>
              <strong>Usar a Força treinada</strong>
              <p>Perícia principal para ativar poderes, sentir presenças, telepatia, transe e percepção ampliada.</p>
              <label className="toggle-line"><input checked={Boolean(useForceSkill?.trained)} type="checkbox" onChange={(event) => updateSkill('usar-a-forca', { trained: event.target.checked })} /> Treinada</label>
            </div>
            <div className={hasTrainingFeat ? 'force-check complete' : 'force-check'}>
              <strong>Treinamento na Força</strong>
              <p>Libera poderes conhecidos. Sugestão atual: {suggestedPowerSlots} poder(es) pela Sabedoria.</p>
              {!hasTrainingFeat && <button type="button" onClick={() => addForceFeat(treinamentoFeatSlug)}>Adicionar aptidão</button>}
            </div>
            <div className={activeSheet.forcePowers.length > 0 ? 'force-check complete' : 'force-check'}>
              <strong>Poderes conhecidos</strong>
              <p>{activeSheet.forcePowers.length} poder(es) selecionado(s). Poderes são recursos limitados e normalmente ficam gastos após uso.</p>
            </div>
          </div>
        </div>

        <div className="force-flow">
          {forceActionSummaries.map((item) => (
            <article className="force-rule-card" key={item.title}>
              <span>{item.meta}</span>
              <strong>{item.title}</strong>
              <RuleHighlights chips={item.highlights} compact />
              <p>{item.text}</p>
            </article>
          ))}
        </div>

        <RichSelectionPanel compact title="Poderes da Força" icon={<Sparkles aria-hidden="true" />} items={forcePowerDetailsCatalog} selected={activeSheet.forcePowers} onChange={(value) => setField('forcePowers', value)} />
        <RichSelectionPanel compact title="Técnicas da Força" icon={<Sparkles aria-hidden="true" />} items={forceTechniqueDetailsCatalog} selected={activeSheet.forceTechniques} onChange={(value) => setField('forceTechniques', value)} />
        <RichSelectionPanel compact title="Segredos da Força" icon={<Sparkles aria-hidden="true" />} items={forceSecretDetailsCatalog} selected={activeSheet.forceSecrets} onChange={(value) => setField('forceSecrets', value)} />
      </Panel>
    );
  }

  function DroidsPanel() {
    return (
      <>
        <GroupedRichSelectionPanel
          icon={<CircleDot aria-hidden="true" />}
          title="Monte seu dróide"
          groupLabel="Configuração"
          itemLabel="Opção"
          items={droidBuilderDetailsCatalog}
          selected={activeSheet.droidSystems}
          onChange={(value) => setField('droidSystems', value)}
          wide
        />
        <GroupedRichSelectionPanel
          icon={<CircleDot aria-hidden="true" />}
          title="Dróides prontos"
          groupLabel="Tipo de dróide"
          itemLabel="Dróide"
          items={readyDroidDetailsCatalog}
          selected={activeSheet.droidSystems}
          onChange={(value) => setField('droidSystems', value)}
          wide
        />
      </>
    );
  }

  function TalentsPanel() {
    const selectedClassSlug = activeSheet.classSlug;
    const isForceSensitive = activeSheet.forceSensitivity || activeSheet.feats.includes('sensivel-a-forca');
    const availableTalents = [
      ...talentDetailsCatalog.filter((item) => item.classRestriction?.includes(selectedClassSlug)),
      ...(isForceSensitive ? forceTalentDetailsCatalog : []),
    ];
    const selectedClassTalents = activeSheet.talents.filter((slug) => availableTalents.some((item) => item.slug === slug));
    const unavailable = activeSheet.talents
      .map((slug) => talentDetailsCatalog.find((item) => item.slug === slug))
      .filter((item): item is DetailCatalogItem => Boolean(item))
      .filter((item) => !availableTalents.some((available) => available.slug === item.slug));

    return (
      <Panel icon={<Sparkles aria-hidden="true" />} title="Talentos">
        <div className="rule-note">
          <strong>Regra de classe</strong>
          <p>Talentos são escolhidos das árvores da classe em que você ganhou o nível. Aptidões são gerais, mas aptidões bônus de classe usam listas específicas da classe.</p>
          <p>Personagens com a aptidão Sensível à Força também podem escolher talentos da Força no lugar do talento de classe (Manual, p. 110). As árvores da Força aparecem na lista quando a ficha é sensível à Força; a árvore do Lado Negro ainda exige Valor do Lado Negro 1+.</p>
        </div>
        {unavailable.length > 0 && (
          <div className="warning-note">
            <strong>Conferir talentos ocultos</strong>
            <p>{unavailable.length} talento(s) já salvo(s) não estão disponíveis para a classe atual (ou exigem sensibilidade à Força) e foram ocultados desta lista. Isso pode estar correto se foram ganhos por multiclasse.</p>
          </div>
        )}
        <GroupedRichSelectionPanel
          compact
          title={isForceSensitive ? `Talentos de ${labelFor(heroicClassCatalog, selectedClassSlug)} e da Força` : `Talentos de ${labelFor(heroicClassCatalog, selectedClassSlug)}`}
          icon={<Sparkles aria-hidden="true" />}
          groupLabel="Árvore de talento"
          itemLabel="Talento"
          items={availableTalents}
          selected={selectedClassTalents}
          onChange={(value) => setField('talents', [...unavailable.map((item) => item.slug), ...value])}
        />
      </Panel>
    );
  }

  function FeatsPanel() {
    const [choice, setChoice] = useState(featCatalog[0]?.slug ?? '');
    const selectedFeat = featCatalog.find((featItem) => featItem.slug === choice) ?? featCatalog[0];
    const selectedFeats = activeSheet.feats
      .map((slug) => featCatalog.find((featItem) => featItem.slug === slug))
      .filter((featItem): featItem is FeatCatalogItem => Boolean(featItem));

    function addFeat() {
      if (choice && !activeSheet.feats.includes(choice)) {
        setField('feats', [...activeSheet.feats, choice]);
      }
    }

    function removeFeat(slug: string) {
      setField('feats', activeSheet.feats.filter((featSlug) => featSlug !== slug));
    }

    return (
      <Panel icon={<BadgePlus aria-hidden="true" />} title="Aptidões">
        <div className="feat-picker">
          <label>
            Aptidão
            <select value={choice} onChange={(event) => setChoice(event.target.value)}>
              {featCatalog.map((featItem) => (
                <option key={featItem.slug} value={featItem.slug}>{featItem.name}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={addFeat}>Adicionar</button>
        </div>

        <div className="feat-preview">
          <strong><WikiLink slug={selectedFeat.slug}>{selectedFeat.name}</WikiLink></strong>
          <RuleHighlights item={selectedFeat} />
          <p>{selectedFeat.benefit}</p>
          <small>Pré-requisitos: {selectedFeat.prerequisites}</small>
        </div>

        <div className="feat-list">
          {selectedFeats.map((featItem) => (
            <article className="feat-card" key={featItem.slug}>
              <div className="feat-card-header">
                <div>
                  <strong><WikiLink slug={featItem.slug}>{featItem.name}</WikiLink></strong>
                  <RuleHighlights item={featItem} compact />
                  <small>{featItem.benefit}</small>
                </div>
                <button type="button" onClick={() => removeFeat(featItem.slug)}>Remover</button>
              </div>
              <details>
                <summary>Ver informações da aptidão</summary>
                <div className="feat-details">
                  <p><b>Pré-requisitos:</b> {featItem.prerequisites}</p>
                  <p><b>Benefício:</b> {featItem.benefit}</p>
                  {featItem.normal && <p><b>Normal:</b> {featItem.normal}</p>}
                  {featItem.special && <p><b>Especial:</b> {featItem.special}</p>}
                </div>
              </details>
            </article>
          ))}
          {selectedFeats.length === 0 && <p className="empty-state">Nenhuma aptidão adicionada ainda.</p>}
        </div>
      </Panel>
    );
  }

  function RichSelectionPanel({ title, icon, items, selected, onChange, compact = false }: { title: string; icon: ReactNode; items: DetailCatalogItem[]; selected: string[]; onChange: (value: string[]) => void; compact?: boolean }) {
    const [choice, setChoice] = useState(items[0]?.slug ?? '');
    const selectedItem = items.find((item) => item.slug === choice) ?? items[0];
    const selectedItems = selected
      .map((slug) => items.find((item) => item.slug === slug))
      .filter((item): item is DetailCatalogItem => Boolean(item));

    useEffect(() => {
      if (items.length > 0 && !items.some((item) => item.slug === choice)) {
        setChoice(items[0].slug);
      }
    }, [choice, items]);

    function addItem() {
      if (choice && !selected.includes(choice)) {
        onChange([...selected, choice]);
      }
    }

    function removeItem(slug: string) {
      onChange(selected.filter((selectedSlug) => selectedSlug !== slug));
    }

    return (
      <section className={compact ? 'embedded-panel' : 'panel identity-panel'}>
        <div className="panel-title">{icon}<h2>{title}</h2></div>
        <div className="feat-picker">
          <label>
            {title}
            <select value={choice} onChange={(event) => setChoice(event.target.value)}>
              {items.map((item) => (
                <option key={item.slug} value={item.slug}>{item.name}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={addItem}>Adicionar</button>
        </div>

        {selectedItem && (
          <div className="feat-preview">
            <strong><WikiLink slug={selectedItem.slug}>{selectedItem.name}</WikiLink></strong>
            <RuleHighlights item={selectedItem} />
            {renderFormattedText(selectedItem.details)}
            {selectedItem.category && <small>Categoria: {selectedItem.category}</small>}
            {selectedItem.classRestriction && selectedItem.classRestriction.length > 0 && (
              <small>Classe: {selectedItem.classRestriction.map((slug) => labelFor(heroicClassCatalog, slug)).join(', ')}</small>
            )}
          </div>
        )}

        <div className="feat-list">
          {selectedItems.map((item) => (
            <article className="feat-card" key={item.slug}>
              <div className="feat-card-header">
                <div>
                  <strong><WikiLink slug={item.slug}>{item.name}</WikiLink></strong>
                  <RuleHighlights item={item} compact />
                  <small>{item.summary}</small>
                </div>
                <button type="button" onClick={() => removeItem(item.slug)}>Remover</button>
              </div>
              <details>
                <summary>Ver informações</summary>
                <div className="feat-details">
                  {item.category && <p><b>Categoria:</b> {item.category}</p>}
                  {item.classRestriction && item.classRestriction.length > 0 && <p><b>Classe:</b> {item.classRestriction.map((slug) => labelFor(heroicClassCatalog, slug)).join(', ')}</p>}
                  {item.prerequisites && <p><b>Pré-requisitos:</b> {item.prerequisites}</p>}
                  <div><b>Efeito:</b>{renderFormattedText(item.details)}</div>
                  {item.extra && <div><b>Observação:</b>{renderFormattedText(item.extra)}</div>}
                </div>
              </details>
            </article>
          ))}
          {selectedItems.length === 0 && <p className="empty-state">Nenhum item adicionado ainda.</p>}
        </div>
      </section>
    );
  }

  function GroupedRichSelectionPanel({
    title,
    icon,
    groupLabel,
    itemLabel,
    items,
    selected,
    onChange,
    compact = false,
    wide = false,
  }: {
    title: string;
    icon: ReactNode;
    groupLabel: string;
    itemLabel: string;
    items: DetailCatalogItem[];
    selected: string[];
    onChange: (value: string[]) => void;
    compact?: boolean;
    wide?: boolean;
  }) {
    const groups = useMemo(
      () => Array.from(new Set(items.map((item) => item.category || 'Geral'))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
      [items],
    );
    const [group, setGroup] = useState(groups[0] ?? '');
    const groupedItems = items.filter((item) => (item.category || 'Geral') === group);
    const [choice, setChoice] = useState(groupedItems[0]?.slug ?? '');
    const selectedItem = groupedItems.find((item) => item.slug === choice) ?? groupedItems[0];
    const selectedItems = selected
      .map((slug) => items.find((item) => item.slug === slug))
      .filter((item): item is DetailCatalogItem => Boolean(item));

    useEffect(() => {
      if (groups.length > 0 && !groups.includes(group)) {
        setGroup(groups[0]);
      }
    }, [group, groups]);

    useEffect(() => {
      if (groupedItems.length > 0 && !groupedItems.some((item) => item.slug === choice)) {
        setChoice(groupedItems[0].slug);
      }
    }, [choice, groupedItems]);

    function addItem() {
      if (choice && !selected.includes(choice)) {
        onChange([...selected, choice]);
      }
    }

    function removeItem(slug: string) {
      onChange(selected.filter((selectedSlug) => selectedSlug !== slug));
    }

    return (
      <section className={compact ? 'embedded-panel' : `panel ${wide ? 'wide-panel' : 'identity-panel'}`}>
        <div className="panel-title">{icon}<h2>{title}</h2></div>
        <div className="grouped-picker">
          <label>
            {groupLabel}
            <select value={group} onChange={(event) => setGroup(event.target.value)}>
              {groups.map((groupName) => <option key={groupName} value={groupName}>{groupName}</option>)}
            </select>
          </label>
          <label>
            {itemLabel}
            <select value={choice} onChange={(event) => setChoice(event.target.value)}>
              {groupedItems.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={addItem}>Adicionar</button>
        </div>

        {selectedItem && (
          <div className="feat-preview">
            <div className="preview-heading">
              <strong><WikiLink slug={selectedItem.slug}>{selectedItem.name}</WikiLink></strong>
              {selectedItem.category && <small>{selectedItem.category}</small>}
            </div>
            <RuleHighlights item={selectedItem} />
            {selectedItem.prerequisites && <small>Pré-requisitos: {selectedItem.prerequisites}</small>}
            {renderFormattedText(selectedItem.details)}
          </div>
        )}

        <div className="feat-list">
          {selectedItems.map((item) => (
            <article className="feat-card" key={item.slug}>
              <div className="feat-card-header">
                <div>
                  <strong><WikiLink slug={item.slug}>{item.name}</WikiLink></strong>
                  <RuleHighlights item={item} compact />
                  <small>{item.category || item.summary}</small>
                </div>
                <button type="button" onClick={() => removeItem(item.slug)}>Remover</button>
              </div>
              <details>
                <summary>Ver informações</summary>
                <div className="feat-details">
                  {item.prerequisites && <p><b>Pré-requisitos:</b> {item.prerequisites}</p>}
                  {renderFormattedText(item.details)}
                  {item.extra && <div className="detail-extra">{renderFormattedText(item.extra)}</div>}
                </div>
              </details>
            </article>
          ))}
          {selectedItems.length === 0 && <p className="empty-state">Nenhum item adicionado ainda.</p>}
        </div>
      </section>
    );
  }

  function SelectionPanel({ title, icon, items, selected, onChange, compact = false }: { title: string; icon: ReactNode; items: CatalogItem[]; selected: string[]; onChange: (value: string[]) => void; compact?: boolean }) {
    const [choice, setChoice] = useState(items[0]?.slug ?? '');
    return (
      <section className={compact ? 'embedded-panel' : 'panel identity-panel'}>
        <div className="panel-title">{icon}<h2>{title}</h2></div>
        <div className="picker-row">
          <select value={choice} onChange={(event) => setChoice(event.target.value)}>{items.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
          <button type="button" onClick={() => choice && !selected.includes(choice) && onChange([...selected, choice])}>Adicionar</button>
        </div>
        <div className="token-list">
          {selected.map((slug) => (
            <button key={slug} type="button" onClick={() => onChange(selected.filter((item) => item !== slug))}>
              <WikiLink slug={slug}>{labelFor(items, slug)}</WikiLink>
            </button>
          ))}
        </div>
      </section>
    );
  }
}

function Panel({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel identity-panel ${className}`.trim()}>
      <div className="panel-title">{icon}<h2>{title}</h2></div>
      {children}
    </section>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label>{label}<input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function NumberInput({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (value: number) => void }) {
  return <label>{label}<input min={min} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function CatalogSelect({ label, value, items, onChange }: { label: string; value: string; items: CatalogItem[]; onChange: (value: string) => void }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Selecionar</option>{items.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>;
}
