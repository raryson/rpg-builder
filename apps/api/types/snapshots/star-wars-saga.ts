export const sagaAbilityKeys = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
] as const;

export type SagaAbilityKey = (typeof sagaAbilityKeys)[number];

export type SagaEra = 'rise-of-the-empire' | 'rebellion-era' | 'new-jedi-order' | 'custom';

export type SagaCatalogRef = {
  id?: string;
  slug: string;
};

export type SagaAbilityScore = {
  baseValue: number;
  speciesModifier: number;
  levelModifier: number;
  temporaryModifier: number;
  totalValue?: number;
  modifier?: number;
  notes?: string;
};

export type SagaDefense = {
  baseValue: number;
  heroicLevelBonus: number;
  classBonus: number;
  abilityModifier: number;
  equipmentBonus: number;
  miscellaneousBonus: number;
  temporaryBonus: number;
  total?: number;
};

export type SagaSkillEntry = {
  skillId?: string;
  skillSlug: string;
  trained: boolean;
  focused: boolean;
  abilityModifier?: number;
  halfLevelBonus?: number;
  trainingBonus?: number;
  focusBonus?: number;
  armorPenalty: number;
  miscellaneousBonus: number;
  temporaryBonus: number;
  total?: number;
  notes?: string;
};

export type SagaClassLevel = {
  classId?: string;
  classSlug: string;
  classType: 'heroic' | 'prestige';
  level: number;
  acquisitionOrder: number;
};

export type SagaFeatEntry = {
  featId?: string;
  featSlug: string;
  acquiredAtLevel: number;
  source: 'species' | 'class' | 'level' | 'bonus' | 'custom';
  notes?: string;
};

export type SagaTalentEntry = {
  talentId?: string;
  talentSlug: string;
  acquiredAtLevel: number;
  sourceClass?: string;
  sourceTree?: string;
  notes?: string;
};

export type SagaForcePowerEntry = {
  powerId?: string;
  powerSlug: string;
  selectedCount: number;
  used: number;
  notes?: string;
};

export type SagaInventoryItem = {
  equipmentId?: string;
  equipmentSlug: string;
  quantity: number;
  equipped: boolean;
  notes?: string;
};

export type SagaOwnedVehicle = {
  vehicleId?: string;
  vehicleSlug: string;
  name?: string;
  notes?: string;
};

export type SagaDroidProfile = {
  droidDegree?: string;
  droidSystems: SagaCatalogRef[];
  locomotion?: string;
  appendages?: string;
  processor?: string;
  installedEquipment: SagaInventoryItem[];
  modifications: string[];
};

export type SagaProgressionEntry = {
  level: number;
  classTaken?: SagaClassLevel;
  abilityIncrease?: Partial<Record<SagaAbilityKey, number>>;
  featSelected?: SagaFeatEntry;
  talentSelected?: SagaTalentEntry;
  skillChanges: Array<{ skillSlug: string; trained?: boolean; focused?: boolean; notes?: string }>;
  forcePowerChanges: Array<{ powerSlug: string; selectedCountDelta: number; notes?: string }>;
  hitPointsGained?: number;
  notes?: string;
  createdAt: string;
};

export type StarWarsSagaSnapshot = {
  identity: {
    characterName: string;
    playerName: string;
    campaignName: string;
    era: SagaEra;
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
    notes: string;
  };
  species: SagaCatalogRef;
  abilities: Record<SagaAbilityKey, SagaAbilityScore>;
  classes: {
    levels: SagaClassLevel[];
    totalLevel?: number;
    heroicLevel?: number;
    prestigeLevel?: number;
    baseAttackBonus?: number;
    classDefenseBonuses: {
      reflex: number;
      fortitude: number;
      will: number;
    };
  };
  combat: {
    hitPoints: {
      current: number;
      maximum: number;
      temporary: number;
      damageTaken: number;
    };
    damageThreshold?: number;
    conditionTrack: {
      currentStep: number;
      modifiers: number;
    };
    defenses: {
      reflex: SagaDefense;
      fortitude: SagaDefense;
      will: SagaDefense;
    };
    initiative?: number;
    perception?: number;
    speed: number;
    baseAttackBonus?: number;
    grappleModifier?: number;
    meleeAttackBonus?: number;
    rangedAttackBonus?: number;
    destinyPoints: number;
    forcePoints: number;
    darkSideScore: number;
  };
  skills: SagaSkillEntry[];
  feats: SagaFeatEntry[];
  talents: SagaTalentEntry[];
  force: {
    forceSensitivity: boolean;
    useTheForceSkill?: SagaSkillEntry;
    forcePoints: number;
    destinyPoints: number;
    darkSideScore: number;
    forcePowers: SagaForcePowerEntry[];
    forceTechniques: SagaCatalogRef[];
    forceSecrets: SagaCatalogRef[];
    forceTradition?: SagaCatalogRef;
  };
  equipment: {
    inventory: SagaInventoryItem[];
    equippedWeapons: SagaCatalogRef[];
    equippedArmor?: SagaCatalogRef;
    credits: number;
    carryingCapacity?: number;
    encumbrance?: string;
    notes: string;
  };
  vehicles: {
    ownedVehicles: SagaOwnedVehicle[];
    assignedVehicle?: SagaCatalogRef;
    pilotNotes: string;
  };
  droid: SagaDroidProfile;
  progressionLog: SagaProgressionEntry[];
  levelUpChoices: SagaProgressionEntry[];
  xpHistory: Array<{ amount: number; reason: string; createdAt: string }>;
  notes: string;
  calculatedAt?: string;
};

const defaultAbility: SagaAbilityScore = {
  baseValue: 10,
  speciesModifier: 0,
  levelModifier: 0,
  temporaryModifier: 0,
};

const defaultDefense: SagaDefense = {
  baseValue: 10,
  heroicLevelBonus: 0,
  classBonus: 0,
  abilityModifier: 0,
  equipmentBonus: 0,
  miscellaneousBonus: 0,
  temporaryBonus: 0,
};

export function createDefaultStarWarsSagaSnapshot(name = 'Novo personagem'): StarWarsSagaSnapshot {
  return {
    identity: {
      characterName: name,
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
      notes: '',
    },
    species: { slug: 'humano' },
    abilities: {
      strength: { ...defaultAbility },
      dexterity: { ...defaultAbility },
      constitution: { ...defaultAbility },
      intelligence: { ...defaultAbility },
      wisdom: { ...defaultAbility },
      charisma: { ...defaultAbility },
    },
    classes: {
      levels: [{ classSlug: 'jedi', classType: 'heroic', level: 1, acquisitionOrder: 1 }],
      classDefenseBonuses: { reflex: 0, fortitude: 0, will: 0 },
    },
    combat: {
      hitPoints: { current: 0, maximum: 0, temporary: 0, damageTaken: 0 },
      conditionTrack: { currentStep: 0, modifiers: 0 },
      defenses: {
        reflex: { ...defaultDefense },
        fortitude: { ...defaultDefense },
        will: { ...defaultDefense },
      },
      speed: 6,
      destinyPoints: 0,
      forcePoints: 5,
      darkSideScore: 0,
    },
    skills: [],
    feats: [],
    talents: [],
    force: {
      forceSensitivity: false,
      forcePoints: 5,
      destinyPoints: 0,
      darkSideScore: 0,
      forcePowers: [],
      forceTechniques: [],
      forceSecrets: [],
    },
    equipment: {
      inventory: [],
      equippedWeapons: [],
      credits: 0,
      notes: '',
    },
    vehicles: {
      ownedVehicles: [],
      pilotNotes: '',
    },
    droid: {
      droidSystems: [],
      installedEquipment: [],
      modifications: [],
    },
    progressionLog: [],
    levelUpChoices: [],
    xpHistory: [],
    notes: '',
  };
}
