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

type SheetTab =
  | 'summary'
  | 'identity'
  | 'species'
  | 'classes'
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
  { id: 'species', label: 'Especie' },
  { id: 'classes', label: 'Classes e Niveis' },
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

const featCatalog = [
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
].map(toCatalogItem);

const talentCatalog = [
  ['Bloqueio', 'Jedi'],
  ['Deflexão', 'Jedi'],
  ['Ataque Furtivo', 'Fora-da-Lei'],
  ['Inspirar Confianca', 'Nobre'],
  ['Sentidos Agudos', 'Batedor'],
  ['Especialista em Armadura', 'Soldado'],
  ['Poder do Lado Negro', 'Forca'],
].map(([name, meta]) => ({ ...toCatalogItem(name), meta }));

const forcePowerCatalog = [
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

const equipmentCatalog = [
  'Sabre de luz',
  'Pistola blaster',
  'Rifle blaster',
  'Granada de fragmentacao',
  'Armadura de combate',
  'Traje de voo',
  'Kit de ferramentas',
  'Medpac',
  'Comlink',
  'Computador portatil',
].map(toCatalogItem);

const vehicleCatalog = ['X-wing', 'TIE Fighter', 'Y-wing', 'Millennium Falcon', 'Speeder bike', 'AT-ST'].map(toCatalogItem);
const droidSystemCatalog = ['Locomocao por rodas', 'Locomocao por pes', 'Processador heuristicos', 'Apêndice manipulador'].map(toCatalogItem);

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
    return parsed.length ? parsed : [createSheet()];
  } catch {
    return [createSheet()];
  }
}

function modifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function toCatalogItem(name: string): CatalogItem {
  return { name, slug: slugify(name) };
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

          {(activeTab === 'summary' || activeTab === 'species' || activeTab === 'classes') && (
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
            <Panel icon={<Dice5 aria-hidden="true" />} title="Pericias">
              <div className="skills-table">
                {activeSheet.skills.map((skill) => {
                  const catalog = skillCatalog.find((item) => item.slug === skill.skillSlug);
                  const ability = catalog?.ability ?? 'strength';
                  const speciesSkillBonus = activeSpecies.skillBonuses[skill.skillSlug] ?? 0;
                  const total = modifier(composedAbilities[ability].total) + Math.floor(activeSheet.totalLevel / 2) + (skill.trained ? 5 : 0) + (skill.focused ? 5 : 0) + speciesSkillBonus + skill.misc;
                  return (
                    <div className="skill-row" key={skill.skillSlug}>
                      <label className="career-toggle" title="Treinada"><input checked={skill.trained} type="checkbox" onChange={(event) => updateSkill(skill.skillSlug, { trained: event.target.checked })} /></label>
                      <div><strong>{catalog?.name}</strong><small>{abilityLabels[ability]}{catalog?.armor ? ' · penalidade de armadura' : ''}</small></div>
                      <label className="career-toggle" title="Foco"><input checked={skill.focused} type="checkbox" onChange={(event) => updateSkill(skill.skillSlug, { focused: event.target.checked })} /></label>
                      <span className="dice-pool">{signed(total)}</span>
                      {speciesSkillBonus !== 0 && <small className="species-note">Raca {signed(speciesSkillBonus)}</small>}
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          {activeTab === 'feats' && <SelectionPanel icon={<BadgePlus aria-hidden="true" />} title="Aptidoes" items={featCatalog} selected={activeSheet.feats} onChange={(value) => setField('feats', value)} />}
          {activeTab === 'talents' && <SelectionPanel icon={<Sparkles aria-hidden="true" />} title="Talentos" items={talentCatalog} selected={activeSheet.talents} onChange={(value) => setField('talents', value)} />}
          {activeTab === 'force' && <ForcePanel />}
          {activeTab === 'equipment' && <SelectionPanel icon={<Package aria-hidden="true" />} title="Equipamentos" items={equipmentCatalog} selected={activeSheet.inventory} onChange={(value) => setField('inventory', value)} />}
          {activeTab === 'vehicles' && <SelectionPanel icon={<Car aria-hidden="true" />} title="Veiculos" items={vehicleCatalog} selected={activeSheet.vehicles} onChange={(value) => setField('vehicles', value)} />}
          {activeTab === 'droids' && <SelectionPanel icon={<CircleDot aria-hidden="true" />} title="Droides" items={droidSystemCatalog} selected={activeSheet.droidSystems} onChange={(value) => setField('droidSystems', value)} />}
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
        <SelectionPanel compact title="Poderes da Forca" icon={<Sparkles aria-hidden="true" />} items={forcePowerCatalog} selected={activeSheet.forcePowers} onChange={(value) => setField('forcePowers', value)} />
      </Panel>
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

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="panel identity-panel">
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
