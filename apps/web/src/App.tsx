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
  Package,
  Save,
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
};

type DetailCatalogItem = CatalogItem & {
  summary: string;
  details: string;
  prerequisites?: string;
  category?: string;
  classRestriction?: string[];
  extra?: string;
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
};

type SkillEntry = {
  skillSlug: string;
  trained: boolean;
  focused: boolean;
  misc: number;
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
  background: string;
  personality: string;
  appearance: string;
  portraitUrl: string;
  speciesSlug: string;
  classSlug: string;
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
  versionNote: string;
  updatedAt: string;
};

const STORAGE_KEY = 'rpg-builder-star-wars-saga-sheets';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const OWNER_ID = import.meta.env.VITE_OWNER_ID ?? 'development-owner';

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
  heroicClass('Jedi', 30, 'd10', 'full', { reflex: 1, fortitude: 1, will: 1 }, ['Sensível à Força', 'Sabre de Luz', 'Armas simples'], '+1 Reflexos, +1 Fortitude, +1 Vontade; BBA completo; PV inicial 30 + Con.'),
  heroicClass('Nobre', 18, 'd6', 'three-quarters', { reflex: 1, fortitude: 0, will: 2 }, ['Linguista', 'Pistolas', 'Armas simples'], '+1 Reflexos, +2 Vontade; BBA 3/4; PV inicial 18 + Con.'),
  heroicClass('Fora-da-Lei', 18, 'd6', 'three-quarters', { reflex: 2, fortitude: 0, will: 1 }, ['Tiro à Queima-Roupa', 'Pistolas', 'Armas simples'], '+2 Reflexos, +1 Vontade; BBA 3/4; PV inicial 18 + Con.'),
  heroicClass('Batedor', 24, 'd8', 'three-quarters', { reflex: 2, fortitude: 1, will: 0 }, ['Recuperação Rápida', 'Pistolas', 'Rifles', 'Armas simples'], '+2 Reflexos, +1 Fortitude; BBA 3/4; PV inicial 24 + Con.'),
  heroicClass('Soldado', 30, 'd10', 'full', { reflex: 1, fortitude: 2, will: 0 }, ['Armas simples', 'Pistolas', 'Rifles', 'Armadura leve', 'Armadura média'], '+1 Reflexos, +2 Fortitude; BBA completo; PV inicial 30 + Con.'),
];

const skillRows: Array<[string, AbilityKey, boolean]> = [
  ['Acrobacia', 'dexterity', true],
  ['Conhecimento', 'intelligence', false],
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

const skillCatalog: Array<CatalogItem & { ability: AbilityKey; armor: boolean }> = skillRows.map(([name, ability, armor]) => ({
  ...toCatalogItem(name),
  ability,
  armor,
}));

const baseFeatNames = [
  'Acuidade com Arma',
  'Ataque Duplo',
  'Ataque Poderoso',
  'Combate Veicular',
  'Esquiva',
  'Foco em Perícia',
  'Poderoso na Força',
  'Proficiência com Armas',
  'Sensitivo à Força',
  'Treinamento na Força',
];

const featCatalog: FeatCatalogItem[] = baseFeatNames.map((name) => {
  const slug = slugify(name);
  const details: Record<string, Omit<FeatCatalogItem, 'name' | 'slug'>> = {
    'acuidade-com-arma': {
      prerequisites: 'BBA +1',
      benefit: 'Com arma leve ou sabre de luz, pode usar Destreza no lugar de Força nas jogadas de ataque corpo a corpo.',
    },
    'ataque-duplo': {
      prerequisites: 'BBA +6 e proficiência com a arma escolhida',
      benefit: 'Em ataque total, faz um ataque extra com a arma escolhida; todos os ataques sofrem -5 até seu próximo turno.',
      normal: 'Normalmente uma ação padrão faz um único ataque.',
      special: 'Pode ser escolhida mais de uma vez para armas ou grupos diferentes.',
    },
    'ataque-poderoso': {
      prerequisites: 'Força 13',
      benefit: 'Troca bônus de ataque por dano extra em ataques corpo a corpo, até o limite do seu bônus base de ataque.',
    },
    'combate-veicular': {
      prerequisites: 'Treinado em Pilotar',
      benefit: 'Uma vez por rodada, como reação, pode negar um acerto contra seu veículo com um teste de Pilotar contra a jogada de ataque. Também conta como proficiente com armas do veículo operadas pelo piloto.',
    },
    esquiva: {
      prerequisites: 'Destreza 13',
      benefit: 'Escolhe um oponente durante seu turno e recebe +1 de bônus de esquiva na Defesa de Reflexos contra ataques dele.',
    },
    'foco-em-pericia': {
      prerequisites: 'Perícia treinada escolhida',
      benefit: 'Uma perícia treinada escolhida recebe +5 de bônus de competência nos testes.',
      special: 'Pode ser escolhida várias vezes, cada vez para uma perícia treinada diferente.',
    },
    'poderoso-na-forca': {
      prerequisites: 'Nenhum',
      benefit: 'Quando gastar Ponto da Força para ajustar ataque, teste de perícia ou teste de habilidade, rola d8 em vez de d6.',
    },
    'proficiencia-com-armas': {
      prerequisites: 'Nenhum',
      benefit: 'Escolhe um grupo de armas. Você ignora a penalidade por falta de proficiência ao atacar com armas daquele grupo.',
      normal: 'Sem proficiência, ataques com a arma sofrem penalidade.',
      special: 'Pode ser escolhida várias vezes para grupos diferentes.',
    },
    'sensitivo-a-forca': {
      prerequisites: 'Nenhum',
      benefit: 'Torna o personagem sensível à Força, permitindo treinar Usar a Força e acessar opções relacionadas à Força.',
    },
    'treinamento-na-forca': {
      prerequisites: 'Sensitivo à Força e treinado em Usar a Força',
      benefit: 'Adiciona ao conjunto de poderes da Força um número de poderes igual a 1 + modificador de Sabedoria, mínimo 1.',
      special: 'Pode ser escolhida várias vezes para aprender mais poderes.',
    },
  };
  return { name, slug, ...(details[slug] ?? { prerequisites: 'Ver manual', benefit: 'Detalhes pendentes de catalogação.' }) };
});

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

const talentDetailsCatalog: DetailCatalogItem[] = [...sagaTalentDetailsCatalog];

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
    background: '',
    personality: '',
    appearance: '',
    portraitUrl: '',
    speciesSlug: 'humano',
    classSlug: 'jedi',
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
    destinyPoints: 0,
    forcePoints: 5,
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
    versionNote: 'Rascunho inicial',
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
  const existingSkills = new Map(sheet.skills.map((skill) => [skill.skillSlug, skill]));
  return {
    ...sheet,
    skills: skillCatalog.map((skill) => existingSkills.get(skill.slug) ?? { skillSlug: skill.slug, trained: false, focused: false, misc: 0 }),
  };
}

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

async function readRemoteSheets() {
  const response = await fetch(apiUrl('/api/web-sheets'), {
    headers: {
      'x-owner-id': OWNER_ID,
    },
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
    headers: {
      'content-type': 'application/json',
      'x-owner-id': OWNER_ID,
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
    headers: {
      'x-owner-id': OWNER_ID,
    },
  });

  if (!response.ok) {
    throw new Error('Não foi possível arquivar ficha no Mongo.');
  }
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

function heroicClass(
  name: string,
  startingHitPoints: number,
  hitDie: string,
  baseAttackProgression: ClassCatalogItem['baseAttackProgression'],
  defenseBonuses: Record<DefenseKey, number>,
  startingFeats: string[],
  description: string,
): ClassCatalogItem {
  return {
    ...toCatalogItem(name),
    startingHitPoints,
    hitDie,
    baseAttackProgression,
    defenseBonuses,
    startingFeats,
    description,
  };
}

function signed(value: number) {
  return value >= 0 ? `+${value}` : String(value);
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  );
}

function renderInlineMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
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

export function App() {
  const [sheets, setSheets] = useState<CharacterSheet[]>(loadSheets);
  const [activeId, setActiveId] = useState(() => sheets[0]?.id);
  const [activeTab, setActiveTab] = useState<SheetTab>('identity');
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const syncTimerRef = useRef<number | null>(null);
  const activeSheet = sheets.find((sheet) => sheet.id === activeId) ?? sheets[0];
  const activeSpecies = speciesCatalog.find((item) => item.slug === activeSheet.speciesSlug) ?? speciesCatalog[0];
  const activeClass = heroicClassCatalog.find((item) => item.slug === activeSheet.classSlug) ?? heroicClassCatalog[0];
  const activeStepIndex = Math.max(0, sheetTabs.findIndex((tab) => tab.id === activeTab));
  const activeStep = sheetTabs[activeStepIndex];
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === sheetTabs.length - 1;
  const progressPercent = ((activeStepIndex + 1) / sheetTabs.length) * 100;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  }, [sheets]);

  useEffect(() => {
    let cancelled = false;

    readRemoteSheets()
      .then((remoteSheets) => {
        if (cancelled) return;

        if (remoteSheets.length > 0) {
          setSheets(remoteSheets);
          setActiveId(remoteSheets[0].id);
        }
      })
      .catch(() => {
        // Mantém o cache local quando a API ou o Mongo estiverem indisponíveis.
      })
      .finally(() => {
        if (!cancelled) {
          setRemoteLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!remoteLoaded) return;

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
  }, [remoteLoaded, sheets]);

  const baseAttackBonus = useMemo(() => {
    return activeClass.baseAttackProgression === 'three-quarters'
      ? Math.floor(activeSheet.totalLevel * 0.75)
      : activeSheet.totalLevel;
  }, [activeClass.baseAttackProgression, activeSheet.totalLevel]);

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
      class: activeClass.defenseBonuses.reflex,
    },
    fortitude: {
      base: 10,
      heroic: activeSheet.totalLevel,
      ability: modifier(composedAbilities.constitution.total),
      species: activeSpecies.defenseBonuses.fortitude,
      class: activeClass.defenseBonuses.fortitude,
    },
    will: {
      base: 10,
      heroic: activeSheet.totalLevel,
      ability: modifier(composedAbilities.wisdom.total),
      species: activeSpecies.defenseBonuses.will,
      class: activeClass.defenseBonuses.will,
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
      talents: sheet.talents.filter((slug) => talentDetailsCatalog.find((item) => item.slug === slug)?.classRestriction?.includes(value)),
      hitPointsMaximum: sheet.hitPointsMaximum === 0 ? suggestedHitPoints : sheet.hitPointsMaximum,
      hitPointsCurrent: sheet.hitPointsCurrent === 0 ? suggestedHitPoints : sheet.hitPointsCurrent,
    }));
  }

  function addSheet() {
    const sheet = createSheet();
    setSheets((current) => [sheet, ...current]);
    setActiveId(sheet.id);
    setActiveTab('identity');
  }

  function duplicateSheet() {
    const copy = { ...activeSheet, id: crypto.randomUUID(), characterName: `${activeSheet.characterName} copia` };
    setSheets((current) => [copy, ...current]);
    setActiveId(copy.id);
  }

  function deleteSheet() {
    void archiveRemoteSheet(activeSheet.id).catch(() => {
      // A remoção local acontece mesmo se o Mongo estiver temporariamente indisponível.
    });

    if (sheets.length === 1) {
      const sheet = createSheet();
      setSheets([sheet]);
      setActiveId(sheet.id);
      setActiveTab('identity');
      return;
    }
    const remaining = sheets.filter((sheet) => sheet.id !== activeSheet.id);
    setSheets(remaining);
    setActiveId(remaining[0].id);
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

  function goToPreviousStep() {
    if (!isFirstStep) {
      setActiveTab(sheetTabs[activeStepIndex - 1].id);
    }
  }

  function goToNextStep() {
    if (!isLastStep) {
      setActiveTab(sheetTabs[activeStepIndex + 1].id);
    }
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

        <button className="primary-action" type="button" onClick={addSheet}>
          <FilePlus2 aria-hidden="true" />
          Nova ficha
        </button>

        <div className="sheet-list" aria-label="Fichas salvas">
          {sheets.map((sheet) => (
            <button className={sheet.id === activeSheet.id ? 'sheet-card active' : 'sheet-card'} key={sheet.id} type="button" onClick={() => setActiveId(sheet.id)}>
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
          </div>
        </header>

        <section className="summary-band">
          <div><UserRound aria-hidden="true" /><span>{labelFor(speciesCatalog, activeSheet.speciesSlug)}</span></div>
          <div><Swords aria-hidden="true" /><span>{labelFor(heroicClassCatalog, activeSheet.classSlug)} nível {activeSheet.totalLevel}</span></div>
          <div><Shield aria-hidden="true" /><span>Ref {defenses.reflex} Fort {defenses.fortitude} Von {defenses.will}</span></div>
          <div><CircleDot aria-hidden="true" /><span>BBA +{baseAttackBonus}</span></div>
        </section>

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
                  <strong>{activeSpecies.name}</strong>
                  <p>{activeSpecies.description}</p>
                  <small>{activeSpecies.size}, deslocamento racial {activeSpecies.speed}</small>
                  <small>Tracos: {activeSpecies.traits.join(', ')}</small>
                </div>
                <div className="detail-box class-source">
                  <strong>{activeClass.name}</strong>
                  <p>{activeClass.description}</p>
                  <small>Aptidões iniciais: {activeClass.startingFeats.join(', ')}</small>
                </div>
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
                  const catalog = skillCatalog.find((item) => item.slug === skill.skillSlug);
                  const ability = catalog?.ability ?? 'strength';
                  const speciesSkillBonus = activeSpecies.skillBonuses[skill.skillSlug] ?? 0;
                  const halfLevelBonus = Math.floor(activeSheet.totalLevel / 2);
                  const abilityModifier = modifier(composedAbilities[ability].total);
                  const levelAndAbilityBonus = halfLevelBonus + abilityModifier;
                  const trainingBonus = skill.trained ? 5 : 0;
                  const focusBonus = skill.focused ? 5 : 0;
                  const otherBonus = speciesSkillBonus + skill.misc;
                  const total = levelAndAbilityBonus + trainingBonus + focusBonus + otherBonus;
                  return (
                    <div className="skill-row" key={skill.skillSlug}>
                      <label className="career-toggle skill-check skill-training" title="Treinada"><input checked={skill.trained} type="checkbox" onChange={(event) => updateSkill(skill.skillSlug, { trained: event.target.checked })} /><span>{signed(trainingBonus)}</span></label>
                      <div><strong>{catalog?.name}</strong><small>{abilityLabels[ability]}{catalog?.armor ? ' · penalidade de armadura' : ''}</small></div>
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
          {(activeTab === 'notes' || activeTab === 'history' || activeTab === 'versions') && (
            <Panel icon={<Save aria-hidden="true" />} title={activeTab === 'versions' ? 'Versões' : activeTab === 'history' ? 'Histórico' : 'Anotações'}>
              <textarea value={activeTab === 'history' ? activeSheet.progressionLog : activeTab === 'versions' ? activeSheet.versionNote : activeSheet.notes} onChange={(event) => setField(activeTab === 'history' ? 'progressionLog' : activeTab === 'versions' ? 'versionNote' : 'notes', event.target.value)} />
            </Panel>
          )}
          {activeTab === 'summary' && <SummaryPanel />}
        </div>

        <footer className="flow-controls">
          <StepControls />
        </footer>
      </section>
    </main>
  );

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

  function SummaryPanel() {
    const selectedFeats = activeSheet.feats.map((slug) => labelFor(featCatalog, slug));
    const selectedTalents = activeSheet.talents.map((slug) => labelFor(talentDetailsCatalog, slug));
    const selectedForcePowers = activeSheet.forcePowers.map((slug) => labelFor(forcePowerDetailsCatalog, slug));
    const selectedForceTechniques = activeSheet.forceTechniques.map((slug) => labelFor(forceTechniqueDetailsCatalog, slug));
    const selectedForceSecrets = activeSheet.forceSecrets.map((slug) => labelFor(forceSecretDetailsCatalog, slug));
    const selectedEquipment = activeSheet.inventory.map((slug) => labelFor(equipmentDetailsCatalog, slug));
    const selectedVehicles = activeSheet.vehicles.map((slug) => labelFor(vehicleDetailsCatalog, slug));
    const selectedDroids = activeSheet.droidSystems.map((slug) =>
      labelFor([...droidBuilderDetailsCatalog, ...readyDroidDetailsCatalog], slug),
    );
    const notableSkills = activeSheet.skills
      .filter((skill) => skill.trained || skill.focused || skill.misc !== 0)
      .map((skill) => {
        const catalog = skillCatalog.find((item) => item.slug === skill.skillSlug);
        const tags = [
          skill.trained ? 'treinada' : '',
          skill.focused ? 'foco' : '',
          skill.misc !== 0 ? `outros ${signed(skill.misc)}` : '',
        ].filter(Boolean);
        return `${catalog?.name ?? skill.skillSlug} (${tags.join(', ')})`;
      });

    return (
      <Panel className="wide-panel summary-review" icon={<CheckCircle2 aria-hidden="true" />} title="Resumo da ficha">
        <div className="summary-grid">
          <SummarySection title="Identidade" items={[
            ['Nome', activeSheet.characterName],
            ['Jogador', activeSheet.playerName],
            ['Campanha', activeSheet.campaignName],
            ['Era', eras.find(([value]) => value === activeSheet.era)?.[1] ?? activeSheet.era],
            ['Destino', activeSheet.destiny],
            ['Gênero', activeSheet.gender],
            ['Idade', activeSheet.age],
            ['Altura', activeSheet.height],
            ['Peso', activeSheet.weight],
            ['Olhos', activeSheet.eyes],
            ['Cabelo', activeSheet.hair],
            ['Pele', activeSheet.skin],
            ['Mundo natal', activeSheet.homeworld],
            ['Retrato', activeSheet.portraitUrl],
          ]} />

          <SummarySection title="Espécie e classe" items={[
            ['Espécie', activeSpecies.name],
            ['Classe', activeClass.name],
            ['Nível total', activeSheet.totalLevel],
            ['Nível heroico', activeSheet.heroicLevel],
            ['Nível prestígio', activeSheet.prestigeLevel],
            ['Deslocamento', activeSheet.speed],
          ]} />

          <SummarySection title="Atributos" items={(Object.keys(activeSheet.abilities) as AbilityKey[]).map((key) => [
            abilityLabels[key],
            `${composedAbilities[key].total} (base ${composedAbilities[key].base}, espécie ${signed(composedAbilities[key].species)}, mod ${signed(modifier(composedAbilities[key].total))})`,
          ])} />

          <SummarySection title="Combate" items={[
            ['PV atual', activeSheet.hitPointsCurrent],
            ['PV máximo', activeSheet.hitPointsMaximum],
            ['PV temporários', activeSheet.hitPointsTemporary],
            ['Dano recebido', activeSheet.damageTaken],
            ['Condição', activeSheet.conditionStep],
            ['Pontos de destino', activeSheet.destinyPoints],
            ['Pontos da Força', activeSheet.forcePoints],
            ['Lado Negro', activeSheet.darkSideScore],
            ['Reflexos', defenses.reflex],
            ['Fortitude', defenses.fortitude],
            ['Vontade', defenses.will],
            ['BBA', `+${baseAttackBonus}`],
          ]} />

          <SummaryList title="Perícias destacadas" items={notableSkills} empty="Nenhuma perícia marcada." />
          <SummaryList title="Aptidões" items={selectedFeats} empty="Nenhuma aptidão adicionada." />
          <SummaryList title="Talentos" items={selectedTalents} empty="Nenhum talento adicionado." />
          <SummaryList title="Força" items={[
            activeSheet.forceSensitivity ? 'Sensível à Força' : 'Não sensível à Força',
            activeSheet.forceTradition ? `Tradição: ${labelFor(['Jedi', 'Sith', 'Bruxas de Dathomir', 'Jensaarai'].map(toCatalogItem), activeSheet.forceTradition)}` : '',
            ...selectedForcePowers.map((item) => `Poder: ${item}`),
            ...selectedForceTechniques.map((item) => `Técnica: ${item}`),
            ...selectedForceSecrets.map((item) => `Segredo: ${item}`),
          ].filter(Boolean)} empty="Nenhuma informação da Força adicionada." />
          <SummaryList title="Equipamentos" items={selectedEquipment} empty="Nenhum equipamento adicionado." />
          <SummaryList title="Veículos" items={selectedVehicles} empty="Nenhum veículo adicionado." />
          <SummaryList title="Dróides" items={selectedDroids} empty="Nenhum dróide adicionado." />

          <SummaryText title="Anotações" value={activeSheet.notes} />
          <SummaryText title="Histórico" value={activeSheet.progressionLog} />
          <SummaryText title="Versões" value={activeSheet.versionNote} />
        </div>
      </Panel>
    );
  }

  function SummarySection({ title, items }: { title: string; items: Array<[string, string | number]> }) {
    return (
      <section className="summary-section">
        <h3>{title}</h3>
        <div className="summary-items">
          {items.map(([label, value]) => (
            <div className="summary-item" key={label}>
              <span>{label}</span>
              <strong>{String(value || 'Não preenchido')}</strong>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function SummaryList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
    return (
      <section className="summary-section">
        <h3>{title}</h3>
        {items.length > 0 ? (
          <div className="summary-list">
            {items.map((item) => <span key={item}>{item}</span>)}
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
    const availableTalents = talentDetailsCatalog.filter((item) => item.classRestriction?.includes(selectedClassSlug));
    const selectedClassTalents = activeSheet.talents.filter((slug) => availableTalents.some((item) => item.slug === slug));
    const unavailable = activeSheet.talents
      .map((slug) => talentDetailsCatalog.find((item) => item.slug === slug))
      .filter((item): item is DetailCatalogItem => Boolean(item))
      .filter((item) => item.classRestriction && item.classRestriction.length > 0 && !item.classRestriction.includes(selectedClassSlug));

    return (
      <Panel icon={<Sparkles aria-hidden="true" />} title="Talentos">
        <div className="rule-note">
          <strong>Regra de classe</strong>
          <p>Talentos são escolhidos das árvores da classe em que você ganhou o nível. Aptidões são gerais, mas aptidões bônus de classe usam listas específicas da classe.</p>
        </div>
        {unavailable.length > 0 && (
          <div className="warning-note">
            <strong>Conferir multiclasse</strong>
            <p>{unavailable.length} talento(s) já salvo(s) não pertencem à classe atual e foram ocultados desta lista. Isso pode estar correto se foram ganhos por multiclasse.</p>
          </div>
        )}
        <GroupedRichSelectionPanel
          compact
          title={`Talentos de ${labelFor(heroicClassCatalog, selectedClassSlug)}`}
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
          <strong>{selectedFeat.name}</strong>
          <RuleHighlights item={selectedFeat} />
          <p>{selectedFeat.benefit}</p>
          <small>Pré-requisitos: {selectedFeat.prerequisites}</small>
        </div>

        <div className="feat-list">
          {selectedFeats.map((featItem) => (
            <article className="feat-card" key={featItem.slug}>
              <div className="feat-card-header">
                <div>
                  <strong>{featItem.name}</strong>
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
            <strong>{selectedItem.name}</strong>
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
                  <strong>{item.name}</strong>
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
              <strong>{selectedItem.name}</strong>
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
                  <strong>{item.name}</strong>
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
            <button key={slug} type="button" onClick={() => onChange(selected.filter((item) => item !== slug))}>{labelFor(items, slug)}</button>
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
