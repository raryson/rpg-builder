import {
  BadgePlus,
  BookOpen,
  Car,
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
import { useEffect, useMemo, useState } from 'react';
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

const sheetTabs: Array<{ id: SheetTab; label: string }> = [
  { id: 'summary', label: 'Resumo' },
  { id: 'identity', label: 'Identidade' },
  { id: 'species', label: 'Especie, Classes e Niveis' },
  { id: 'abilities', label: 'Atributos' },
  { id: 'combat', label: 'Combate' },
  { id: 'skills', label: 'Pericias' },
  { id: 'feats', label: 'Aptidoes' },
  { id: 'talents', label: 'Talentos' },
  { id: 'force', label: 'Forca' },
  { id: 'equipment', label: 'Equipamentos' },
  { id: 'vehicles', label: 'Veiculos' },
  { id: 'droids', label: 'Droides' },
  { id: 'notes', label: 'Anotacoes' },
  { id: 'history', label: 'Historico' },
  { id: 'versions', label: 'Versoes' },
];

const eras = [
  ['rise-of-the-empire', 'Ascensao do Imperio'],
  ['rebellion-era', 'Era da Rebeliao'],
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
  species('Humano', {}, {}, {}, 6, 'Medio', ['Pericia treinada extra no 1º nivel', 'Aptidao extra no 1º nivel'], 'Sem ajuste de habilidade; ganha uma pericia treinada extra e uma aptidao extra no 1º nivel.'),
  species('Bothan', { dexterity: 2, constitution: -2 }, { will: 2 }, {}, 6, 'Medio', ['Vontade de Ferro', 'Foco em Obter Informacoes se treinado'], '+2 Des, -2 Con; +2 especie em Vontade.'),
  species('Cereano', { dexterity: -2, intelligence: 2, wisdom: 2 }, {}, {}, 6, 'Medio', ['Refaz Iniciativa', 'Foco em Iniciativa se treinado'], '+2 Int, +2 Sab, -2 Des; refaz testes de Iniciativa.'),
  species('Devaroniano', { dexterity: 2, wisdom: -2, charisma: -2 }, {}, {}, 6, 'Medio', ['Padrao masculino aplicado', 'Femea: +2 Sab, -2 Des', 'Curiosidade Natural'], '+2 Des, -2 Sab, -2 Car no padrao masculino; ajuste feminino deve ser editado manualmente.'),
  species('Duros', { dexterity: 2, constitution: -2, intelligence: 2 }, {}, {}, 6, 'Medio', ['Refaz Pilotar'], '+2 Des, +2 Int, -2 Con; piloto experiente.'),
  species('Ewok', { strength: -2, dexterity: 2 }, { reflex: 1 }, { furtividade: 5 }, 4, 'Pequeno', ['Pequeno', 'Primitivo', 'Olfato', 'Refaz Furtividade'], '+2 Des, -2 For; tamanho Pequeno: +1 Reflexos e +5 Furtividade; deslocamento 4.'),
  species('Gamorreano', { strength: 2, dexterity: -2, intelligence: -2 }, { fortitude: 2 }, {}, 6, 'Medio', ['Primitivo', 'Grande Fortitude', 'Limite de Dano Aprimorado'], '+2 For, -2 Des, -2 Int; +2 especie em Fortitude.'),
  species('Gungan', { dexterity: 2, intelligence: -2, charisma: -2 }, {}, {}, 6, 'Medio', ['Nado 4', 'Nadador Experiente', 'Prender respiracao'], '+2 Des, -2 Int, -2 Car; deslocamento 6 e nado 4.'),
  species('Ithoriano', { dexterity: -2, wisdom: 2, charisma: 2 }, { will: 2 }, {}, 6, 'Medio', ['Vontade de Ferro', 'Urrar', 'Refaz Sobrevivencia'], '+2 Sab, +2 Car, -2 Des; +2 especie em Vontade.'),
  species('Kel Dor', { dexterity: 2, constitution: -2, wisdom: 2 }, {}, {}, 6, 'Medio', ['Senso Apurado da Forca', 'Visao na Penumbra', 'Equipamento especial'], '+2 Des, +2 Sab, -2 Con; refaz certos usos de Usar a Forca.'),
  species('Mon Calamariano', { constitution: -2, intelligence: 2, wisdom: 2 }, {}, {}, 6, 'Medio', ['Anfibio', 'Nado 4', 'Nadador Experiente'], '+2 Int, +2 Sab, -2 Con; anfibio e nado 4.'),
  species('Quarren', { constitution: 2, wisdom: -2, charisma: -2 }, {}, {}, 6, 'Medio', ['Aquatico', 'Nado 4', 'Visao na Penumbra', 'Foco em Persuasao se treinado'], '+2 Con, -2 Sab, -2 Car; aquatico e nado 4.'),
  species('Rodiano', { dexterity: 2, wisdom: -2, charisma: -2 }, {}, {}, 6, 'Medio', ['Cacador nato'], '+2 Des, -2 Sab, -2 Car.'),
  species('Sullustano', { dexterity: 2, constitution: -2 }, {}, {}, 6, 'Medio', ['Ver no Escuro', 'Escolhe 10 em Escalar', 'Refaz Percepcao'], '+2 Des, -2 Con; ver no escuro e refaz Percepcao.'),
  species('Trandoshano', { strength: 2, dexterity: -2 }, { reflex: 1 }, {}, 6, 'Medio', ['Ver no Escuro', 'Regeneracao', 'Armadura Natural', 'Vigoroso'], '+2 For, -2 Des; armadura natural +1 Reflexos.'),
  species("Twi'lek", { wisdom: -2, charisma: 2 }, {}, {}, 6, 'Medio', ['Comunicacao por lekku'], '+2 Car, -2 Sab.'),
  species('Wookiee', { strength: 4, dexterity: -2, constitution: 2, wisdom: -2, charisma: -2 }, {}, {}, 6, 'Medio', ['Recuperacao Extraordinaria', 'Furia', 'Escolhe 10 em Escalar'], '+4 For, +2 Con, -2 Des, -2 Sab, -2 Car; furia e recuperacao extraordinaria.'),
  species('Zabrak', {}, {}, {}, 6, 'Medio', ['Sem ajuste de habilidade'], 'Sem ajustes de habilidade na Tabela 2-1.'),
];

const heroicClassCatalog: ClassCatalogItem[] = [
  heroicClass('Jedi', 30, 'd10', 'full', { reflex: 1, fortitude: 1, will: 1 }, ['Sensivel a Forca', 'Sabre de Luz', 'Armas simples'], '+1 Reflexos, +1 Fortitude, +1 Vontade; BBA completo; PV inicial 30 + Con.'),
  heroicClass('Nobre', 18, 'd6', 'three-quarters', { reflex: 1, fortitude: 0, will: 2 }, ['Linguista', 'Pistolas', 'Armas simples'], '+1 Reflexos, +2 Vontade; BBA 3/4; PV inicial 18 + Con.'),
  heroicClass('Fora-da-Lei', 18, 'd6', 'three-quarters', { reflex: 2, fortitude: 0, will: 1 }, ['Tiro a Queima Roupa', 'Pistolas', 'Armas simples'], '+2 Reflexos, +1 Vontade; BBA 3/4; PV inicial 18 + Con.'),
  heroicClass('Batedor', 24, 'd8', 'three-quarters', { reflex: 2, fortitude: 1, will: 0 }, ['Recuperacao Rapida', 'Pistolas', 'Rifles', 'Armas simples'], '+2 Reflexos, +1 Fortitude; BBA 3/4; PV inicial 24 + Con.'),
  heroicClass('Soldado', 30, 'd10', 'full', { reflex: 1, fortitude: 2, will: 0 }, ['Armas simples', 'Pistolas', 'Rifles', 'Armadura leve', 'Armadura media'], '+1 Reflexos, +2 Fortitude; BBA completo; PV inicial 30 + Con.'),
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
  'Foco em Pericia',
  'Poderoso na Forca',
  'Proficiência com Armas',
  'Sensitivo a Forca',
  'Treinamento na Forca',
];

const featCatalog: FeatCatalogItem[] = baseFeatNames.map((name) => {
  const slug = slugify(name);
  const details: Record<string, Omit<FeatCatalogItem, 'name' | 'slug'>> = {
    'acuidade-com-arma': {
      prerequisites: 'BBA +1',
      benefit: 'Com arma leve ou sabre de luz, pode usar Destreza no lugar de Forca nas jogadas de ataque corpo a corpo.',
    },
    'ataque-duplo': {
      prerequisites: 'BBA +6 e proficiencia com a arma escolhida',
      benefit: 'Em ataque total, faz um ataque extra com a arma escolhida; todos os ataques sofrem -5 ate seu proximo turno.',
      normal: 'Normalmente uma acao padrao faz um unico ataque.',
      special: 'Pode ser escolhida mais de uma vez para armas ou grupos diferentes.',
    },
    'ataque-poderoso': {
      prerequisites: 'Forca 13',
      benefit: 'Troca bonus de ataque por dano extra em ataques corpo a corpo, ate o limite do seu bonus base de ataque.',
    },
    'combate-veicular': {
      prerequisites: 'Treinado em Pilotar',
      benefit: 'Uma vez por rodada, como reacao, pode negar um acerto contra seu veiculo com um teste de Pilotar contra a jogada de ataque. Tambem conta como proficiente com armas do veiculo operadas pelo piloto.',
    },
    esquiva: {
      prerequisites: 'Destreza 13',
      benefit: 'Escolhe um oponente durante seu turno e recebe +1 de bonus de esquiva na Defesa de Reflexos contra ataques dele.',
    },
    'foco-em-pericia': {
      prerequisites: 'Pericia treinada escolhida',
      benefit: 'Uma pericia treinada escolhida recebe +5 de bonus de competencia nos testes.',
      special: 'Pode ser escolhida varias vezes, cada vez para uma pericia treinada diferente.',
    },
    'poderoso-na-forca': {
      prerequisites: 'Nenhum',
      benefit: 'Quando gastar Ponto da Forca para ajustar ataque, teste de pericia ou teste de habilidade, rola d8 em vez de d6.',
    },
    'proficiencia-com-armas': {
      prerequisites: 'Nenhum',
      benefit: 'Escolhe um grupo de armas. Voce ignora a penalidade por falta de proficiencia ao atacar com armas daquele grupo.',
      normal: 'Sem proficiencia, ataques com a arma sofrem penalidade.',
      special: 'Pode ser escolhida varias vezes para grupos diferentes.',
    },
    'sensitivo-a-forca': {
      prerequisites: 'Nenhum',
      benefit: 'Torna o personagem sensivel a Forca, permitindo treinar Usar a Forca e acessar opcoes relacionadas a Forca.',
    },
    'treinamento-na-forca': {
      prerequisites: 'Sensitivo a Forca e treinado em Usar a Forca',
      benefit: 'Adiciona ao conjunto de poderes da Forca um numero de poderes igual a 1 + modificador de Sabedoria, minimo 1.',
      special: 'Pode ser escolhida varias vezes para aprender mais poderes.',
    },
  };
  return { name, slug, ...(details[slug] ?? { prerequisites: 'Ver manual', benefit: 'Detalhes pendentes de catalogacao.' }) };
});

const baseForcePowerCatalog = [
  'Estrangulamento da Forca',
  'Desarmar da Forca',
  'Empurrão da Forca',
  'Furia Sombria',
  'Impulso',
  'Mover Objeto',
  'Negar Energia',
  'Relampago da Forca',
  'Rompimento da Forca',
  'Transferencia Vital',
  'Truque Mental',
  'Visão Distante',
].map(toCatalogItem);

const vehicleCatalog = ['X-wing', 'TIE Fighter', 'Y-wing', 'Millennium Falcon', 'Speeder bike', 'AT-ST'].map(toCatalogItem);

const talentDetailsCatalog: DetailCatalogItem[] = [...sagaTalentDetailsCatalog];

const forcePowerDetailsCatalog: DetailCatalogItem[] = [
  detailItem('Estrangulamento da Forca', 'Poder da Forca', 'Restringe uma criatura e causa dano conforme o teste de Usar a Forca.', 'Lado Negro'),
  detailItem('Desarmar da Forca', 'Poder da Forca', 'Usa telecinese para desarmar o alvo; pode derrubar o item ou traze-lo para sua mao.', 'Telecinese'),
  detailItem('Empurrao da Forca', 'Poder da Forca', 'Empurra o alvo para tras com teste resistido e pode causar dano por colisao.', 'Telecinese'),
  detailItem('Furia Sombria', 'Poder da Forca', 'Concede bonus de furia em ataques e dano corpo a corpo por meio do Lado Negro.', 'Lado Negro'),
  detailItem('Impulso', 'Poder da Forca', 'Aumenta movimento e saltos usando a Forca.', 'Movimento'),
  detailItem('Mover Objeto', 'Poder da Forca', 'Move objetos ou criaturas e pode arremessa-los para causar dano.', 'Telecinese'),
  detailItem('Negar Energia', 'Poder da Forca', 'Reduz ou anula dano de energia recebido, dependendo do teste.', 'Defensivo'),
  detailItem('Relampago da Forca', 'Poder da Forca', 'Ataque do Lado Negro que causa dano e move o alvo no marcador de condicao.', 'Lado Negro'),
  detailItem('Rompimento da Forca', 'Poder da Forca', 'Dificulta ou corta temporariamente o acesso de outro usuario a Pontos e poderes da Forca.', 'Lado da Luz'),
  detailItem('Transferencia Vital', 'Poder da Forca', 'Cura outra criatura viva usando sua propria forca vital.', 'Lado da Luz'),
  detailItem('Truque Mental', 'Poder da Forca', 'Altera percepcao, cria sugestao, distracao ou medo em uma criatura com mente.', 'Afetar a mente'),
  detailItem('Visao Distante', 'Poder da Forca', 'Permite receber impressao vaga de eventos envolvendo uma criatura conhecida distante.', 'Percepcao'),
];

const forceTechniqueDetailsCatalog: DetailCatalogItem[] = [
  detailItem('Recuperar Ponto da Forca', 'Tecnica da Forca', 'No fim de um encontro, recupera automaticamente 1 Ponto da Forca gasto durante esse encontro.', 'Tecnica'),
  detailItem('Mestria com Poder da Forca', 'Tecnica da Forca', 'Escolha um poder; voce pode escolher 10 para ativa-lo mesmo sob ameaca.', 'Tecnica'),
  detailItem('Transe da Forca Aprimorado', 'Tecnica da Forca', 'Melhora a recuperacao de pontos de vida durante transe da Forca.', 'Tecnica'),
];

const forceSecretDetailsCatalog: DetailCatalogItem[] = [
  detailItem('Poder Devastador', 'Segredo da Forca', 'Aprimora um poder da Forca para gerar efeito mais intenso.', 'Segredo'),
  detailItem('Poder Multialvo', 'Segredo da Forca', 'Permite ampliar um poder para afetar mais de um alvo quando aplicavel.', 'Segredo'),
  detailItem('Poder Rapido', 'Segredo da Forca', 'Reduz o tempo de ativacao de um poder escolhido quando aplicavel.', 'Segredo'),
];

const equipmentDetailsCatalog: DetailCatalogItem[] = [...sagaEquipmentDetailsCatalog];

const vehicleDetailsCatalog: DetailCatalogItem[] = [...sagaVehicleDetailsCatalog];

const droidSystemDetailsCatalog: DetailCatalogItem[] = [...sagaDroidDetailsCatalog];

const abilityLabels: Record<AbilityKey, string> = {
  strength: 'Forca',
  dexterity: 'Destreza',
  constitution: 'Constituicao',
  intelligence: 'Inteligencia',
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
      <span className="species-source">Bonus de raca</span>
      <span className="class-source">Bonus de classe</span>
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

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();
    if (!line || line === '---') continue;

    if (line.startsWith('|') && lines[index + 1]?.trim().startsWith('|') && lines[index + 1]?.includes('---')) {
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

export function App() {
  const [sheets, setSheets] = useState<CharacterSheet[]>(loadSheets);
  const [activeId, setActiveId] = useState(() => sheets[0]?.id);
  const [activeTab, setActiveTab] = useState<SheetTab>('summary');
  const activeSheet = sheets.find((sheet) => sheet.id === activeId) ?? sheets[0];
  const activeSpecies = speciesCatalog.find((item) => item.slug === activeSheet.speciesSlug) ?? speciesCatalog[0];
  const activeClass = heroicClassCatalog.find((item) => item.slug === activeSheet.classSlug) ?? heroicClassCatalog[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  }, [sheets]);

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
  }

  function duplicateSheet() {
    const copy = { ...activeSheet, id: crypto.randomUUID(), characterName: `${activeSheet.characterName} copia` };
    setSheets((current) => [copy, ...current]);
    setActiveId(copy.id);
  }

  function deleteSheet() {
    if (sheets.length === 1) {
      const sheet = createSheet();
      setSheets([sheet]);
      setActiveId(sheet.id);
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
          <div><Swords aria-hidden="true" /><span>{labelFor(heroicClassCatalog, activeSheet.classSlug)} nivel {activeSheet.totalLevel}</span></div>
          <div><Shield aria-hidden="true" /><span>Ref {defenses.reflex} Fort {defenses.fortitude} Von {defenses.will}</span></div>
          <div><CircleDot aria-hidden="true" /><span>BBA +{baseAttackBonus}</span></div>
        </section>

        <nav className="tabs" aria-label="Secoes da ficha">
          {sheetTabs.map((tab) => (
            <button className={activeTab === tab.id ? 'tab active' : 'tab'} key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="grid">
          {(activeTab === 'summary' || activeTab === 'identity') && (
            <Panel icon={<BookOpen aria-hidden="true" />} title="Identidade">
              <div className="form-grid">
                <TextInput label="Nome" value={activeSheet.characterName} onChange={(value) => setField('characterName', value)} />
                <TextInput label="Jogador" value={activeSheet.playerName} onChange={(value) => setField('playerName', value)} />
                <TextInput label="Campanha" value={activeSheet.campaignName} onChange={(value) => setField('campaignName', value)} />
                <label>Era<select value={activeSheet.era} onChange={(event) => setField('era', event.target.value as CharacterSheet['era'])}>{eras.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <TextInput label="Destino" value={activeSheet.destiny} onChange={(value) => setField('destiny', value)} />
                <TextInput label="Genero" value={activeSheet.gender} onChange={(value) => setField('gender', value)} />
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

          {(activeTab === 'summary' || activeTab === 'species') && (
            <Panel icon={<UserRound aria-hidden="true" />} title="Especie e classes">
              <div className="form-grid">
                <CatalogSelect label="Especie" value={activeSheet.speciesSlug} items={speciesCatalog} onChange={setSpeciesSlug} />
                <CatalogSelect label="Classe heroica" value={activeSheet.classSlug} items={heroicClassCatalog} onChange={setClassSlug} />
                <NumberInput label="Nivel total" value={activeSheet.totalLevel} min={1} onChange={(value) => setField('totalLevel', value)} />
                <NumberInput label="Nivel heroico" value={activeSheet.heroicLevel} min={0} onChange={(value) => setField('heroicLevel', value)} />
                <NumberInput label="Nivel prestigio" value={activeSheet.prestigeLevel} min={0} onChange={(value) => setField('prestigeLevel', value)} />
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
                  <small>Aptidoes iniciais: {activeClass.startingFeats.join(', ')}</small>
                </div>
              </div>
            </Panel>
          )}

          {(activeTab === 'summary' || activeTab === 'abilities') && (
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

          {(activeTab === 'summary' || activeTab === 'combat') && (
            <Panel icon={<Shield aria-hidden="true" />} title="Combate">
              <div className="condition-grid">
                <NumberInput label="PV atual" value={activeSheet.hitPointsCurrent} min={0} onChange={(value) => setField('hitPointsCurrent', value)} />
                <NumberInput label="PV maximo" value={activeSheet.hitPointsMaximum} min={0} onChange={(value) => setField('hitPointsMaximum', value)} />
                <NumberInput label="PV temporarios" value={activeSheet.hitPointsTemporary} min={0} onChange={(value) => setField('hitPointsTemporary', value)} />
                <NumberInput label="Dano recebido" value={activeSheet.damageTaken} min={0} onChange={(value) => setField('damageTaken', value)} />
                <NumberInput label="Marcador de condicao" value={activeSheet.conditionStep} min={-5} onChange={(value) => setField('conditionStep', value)} />
                <NumberInput label="Pontos de destino" value={activeSheet.destinyPoints} min={0} onChange={(value) => setField('destinyPoints', value)} />
                <NumberInput label="Pontos da Forca" value={activeSheet.forcePoints} min={0} onChange={(value) => setField('forcePoints', value)} />
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
                      <b className="species-source">Raca {signed(defenseBreakdown[key].species)}</b>
                      <b className="class-source">Classe {signed(defenseBreakdown[key].class)}</b>
                    </div>
                  </div>
                ))}
                <div className="detail-box class-source">
                  <strong>PV inicial sugerido {expectedStartingHitPoints}</strong>
                  <p>{activeClass.startingHitPoints} da classe + modificador de Constituicao final.</p>
                </div>
              </div>
              <SourceLegend />
            </Panel>
          )}

          {activeTab === 'skills' && (
            <Panel className="skills-panel-full" icon={<Dice5 aria-hidden="true" />} title="Pericias">
              <div className="skills-table skill-grid-table">
                <div className="skill-header">
                  <span>Nome da pericia</span>
                  <span>Bonus de pericia</span>
                  <span>1/2 nivel + habilidade</span>
                  <span>Treinamento</span>
                  <span>Foco em pericia</span>
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
                        <input aria-label={`Outros bonus de ${catalog?.name}`} type="number" value={skill.misc} onChange={(event) => updateSkill(skill.skillSlug, { misc: Number(event.target.value) })} />
                        <small>Total outros {signed(otherBonus)}</small>
                      </div>
                      {speciesSkillBonus !== 0 && <small className="species-note">Raca {signed(speciesSkillBonus)}</small>}
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          {activeTab === 'feats' && <FeatsPanel />}
          {activeTab === 'talents' && <TalentsPanel />}
          {activeTab === 'force' && <ForcePanel />}
          {activeTab === 'equipment' && <GroupedRichSelectionPanel icon={<Package aria-hidden="true" />} title="Equipamentos" groupLabel="Subdivisao" itemLabel="Equipamento" items={equipmentDetailsCatalog} selected={activeSheet.inventory} onChange={(value) => setField('inventory', value)} />}
          {activeTab === 'vehicles' && <GroupedRichSelectionPanel icon={<Car aria-hidden="true" />} title="Veiculos" groupLabel="Subdivisao" itemLabel="Veiculo" items={vehicleDetailsCatalog} selected={activeSheet.vehicles} onChange={(value) => setField('vehicles', value)} />}
          {activeTab === 'droids' && <GroupedRichSelectionPanel icon={<CircleDot aria-hidden="true" />} title="Droides" groupLabel="Subdivisao" itemLabel="Droide" items={droidSystemDetailsCatalog} selected={activeSheet.droidSystems} onChange={(value) => setField('droidSystems', value)} />}
          {(activeTab === 'notes' || activeTab === 'history' || activeTab === 'versions') && (
            <Panel icon={<Save aria-hidden="true" />} title={activeTab === 'versions' ? 'Versoes' : activeTab === 'history' ? 'Historico' : 'Anotacoes'}>
              <textarea value={activeTab === 'history' ? activeSheet.progressionLog : activeTab === 'versions' ? activeSheet.versionNote : activeSheet.notes} onChange={(event) => setField(activeTab === 'history' ? 'progressionLog' : activeTab === 'versions' ? 'versionNote' : 'notes', event.target.value)} />
            </Panel>
          )}
        </div>
      </section>
    </main>
  );

  function updateSkill(skillSlug: string, patch: Partial<SkillEntry>) {
    updateActiveSheet((sheet) => ({
      ...sheet,
      skills: sheet.skills.map((skill) => (skill.skillSlug === skillSlug ? { ...skill, ...patch } : skill)),
    }));
  }

  function ForcePanel() {
    return (
      <Panel icon={<Sparkles aria-hidden="true" />} title="A Forca">
        <div className="form-grid">
          <label className="toggle-line"><input checked={activeSheet.forceSensitivity} type="checkbox" onChange={(event) => setField('forceSensitivity', event.target.checked)} /> Sensivel a Forca</label>
          <CatalogSelect label="Tradicao da Forca" value={activeSheet.forceTradition} items={['Jedi', 'Sith', 'Bruxas de Dathomir', 'Jensaarai'].map(toCatalogItem)} onChange={(value) => setField('forceTradition', value)} />
        </div>
        <RichSelectionPanel compact title="Poderes da Forca" icon={<Sparkles aria-hidden="true" />} items={forcePowerDetailsCatalog} selected={activeSheet.forcePowers} onChange={(value) => setField('forcePowers', value)} />
        <RichSelectionPanel compact title="Tecnicas da Forca" icon={<Sparkles aria-hidden="true" />} items={forceTechniqueDetailsCatalog} selected={activeSheet.forceTechniques} onChange={(value) => setField('forceTechniques', value)} />
        <RichSelectionPanel compact title="Segredos da Forca" icon={<Sparkles aria-hidden="true" />} items={forceSecretDetailsCatalog} selected={activeSheet.forceSecrets} onChange={(value) => setField('forceSecrets', value)} />
      </Panel>
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
          <p>Talentos sao escolhidos das arvores da classe em que voce ganhou o nivel. Aptidoes sao gerais, mas aptidoes bonus de classe usam listas especificas da classe.</p>
        </div>
        {unavailable.length > 0 && (
          <div className="warning-note">
            <strong>Conferir multiclasse</strong>
            <p>{unavailable.length} talento(s) ja salvo(s) nao pertencem a classe atual e foram ocultados desta lista. Isso pode estar correto se foram ganhos por multiclasse.</p>
          </div>
        )}
        <GroupedRichSelectionPanel
          compact
          title={`Talentos de ${labelFor(heroicClassCatalog, selectedClassSlug)}`}
          icon={<Sparkles aria-hidden="true" />}
          groupLabel="Arvore de talento"
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
      <Panel icon={<BadgePlus aria-hidden="true" />} title="Aptidoes">
        <div className="feat-picker">
          <label>
            Aptidao
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
          <p>{selectedFeat.benefit}</p>
          <small>Pre-requisitos: {selectedFeat.prerequisites}</small>
        </div>

        <div className="feat-list">
          {selectedFeats.map((featItem) => (
            <article className="feat-card" key={featItem.slug}>
              <div className="feat-card-header">
                <div>
                  <strong>{featItem.name}</strong>
                  <small>{featItem.benefit}</small>
                </div>
                <button type="button" onClick={() => removeFeat(featItem.slug)}>Remover</button>
              </div>
              <details>
                <summary>Ver informacoes da aptidao</summary>
                <div className="feat-details">
                  <p><b>Pre-requisitos:</b> {featItem.prerequisites}</p>
                  <p><b>Beneficio:</b> {featItem.benefit}</p>
                  {featItem.normal && <p><b>Normal:</b> {featItem.normal}</p>}
                  {featItem.special && <p><b>Especial:</b> {featItem.special}</p>}
                </div>
              </details>
            </article>
          ))}
          {selectedFeats.length === 0 && <p className="empty-state">Nenhuma aptidao adicionada ainda.</p>}
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
                  <small>{item.summary}</small>
                </div>
                <button type="button" onClick={() => removeItem(item.slug)}>Remover</button>
              </div>
              <details>
                <summary>Ver informacoes</summary>
                <div className="feat-details">
                  {item.category && <p><b>Categoria:</b> {item.category}</p>}
                  {item.classRestriction && item.classRestriction.length > 0 && <p><b>Classe:</b> {item.classRestriction.map((slug) => labelFor(heroicClassCatalog, slug)).join(', ')}</p>}
                  {item.prerequisites && <p><b>Pre-requisitos:</b> {item.prerequisites}</p>}
                  <div><b>Efeito:</b>{renderFormattedText(item.details)}</div>
                  {item.extra && <div><b>Observacao:</b>{renderFormattedText(item.extra)}</div>}
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
  }: {
    title: string;
    icon: ReactNode;
    groupLabel: string;
    itemLabel: string;
    items: DetailCatalogItem[];
    selected: string[];
    onChange: (value: string[]) => void;
    compact?: boolean;
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
      <section className={compact ? 'embedded-panel' : 'panel identity-panel'}>
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
            {selectedItem.prerequisites && <small>Pre-requisitos: {selectedItem.prerequisites}</small>}
            {renderFormattedText(selectedItem.details)}
          </div>
        )}

        <div className="feat-list">
          {selectedItems.map((item) => (
            <article className="feat-card" key={item.slug}>
              <div className="feat-card-header">
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.category || item.summary}</small>
                </div>
                <button type="button" onClick={() => removeItem(item.slug)}>Remover</button>
              </div>
              <details>
                <summary>Ver informacoes</summary>
                <div className="feat-details">
                  {item.prerequisites && <p><b>Pre-requisitos:</b> {item.prerequisites}</p>}
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
