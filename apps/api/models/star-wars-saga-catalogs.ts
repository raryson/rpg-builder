import { model, models, Schema, type InferSchemaType } from 'mongoose';

const AbilityModifierSchema = new Schema(
  {
    strength: { type: Number, default: 0 },
    dexterity: { type: Number, default: 0 },
    constitution: { type: Number, default: 0 },
    intelligence: { type: Number, default: 0 },
    wisdom: { type: Number, default: 0 },
    charisma: { type: Number, default: 0 },
  },
  { _id: false },
);

const DefenseBonusesSchema = new Schema(
  {
    reflex: { type: Number, default: 0 },
    fortitude: { type: Number, default: 0 },
    will: { type: Number, default: 0 },
  },
  { _id: false },
);

const CatalogBase = {
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true, trim: true },
  sourcePage: { type: Number, default: null },
  description: { type: String, default: '' },
};

const StarWarsSpeciesSchema = new Schema(
  {
    ...CatalogBase,
    size: { type: String, required: true },
    speed: { type: Number, required: true },
    abilityModifiers: { type: AbilityModifierSchema, default: () => ({}) },
    defenseBonuses: { type: DefenseBonusesSchema, default: () => ({}) },
    skillBonuses: { type: Schema.Types.Mixed, default: {} },
    specialTraits: { type: [String], default: [] },
    conditionalBonusFeats: { type: [String], default: [] },
    automaticLanguages: { type: [String], default: [] },
    bonusLanguages: { type: [String], default: [] },
  },
  { timestamps: true },
);

const StarWarsHeroicClassSchema = new Schema(
  {
    ...CatalogBase,
    hitDie: { type: String, required: true },
    startingHitPoints: { type: Number, required: true },
    baseAttackBonusProgression: {
      type: String,
      enum: ['full', 'three-quarters'],
      required: true,
    },
    defenseBonuses: { type: DefenseBonusesSchema, default: () => ({}) },
    trainedSkills: { type: [String], default: [] },
    startingFeats: { type: [String], default: [] },
    talentTrees: { type: [String], default: [] },
    classFeatures: { type: [String], default: [] },
    credits: { type: String, default: '' },
  },
  { timestamps: true },
);

const StarWarsPrestigeClassSchema = new Schema(
  {
    ...CatalogBase,
    prerequisites: { type: [String], default: [] },
    hitDie: { type: String, required: true },
    baseAttackBonusProgression: {
      type: String,
      enum: ['full', 'three-quarters'],
      required: true,
    },
    defenseBonuses: { type: DefenseBonusesSchema, default: () => ({}) },
    talentTrees: { type: [String], default: [] },
    classFeatures: { type: [String], default: [] },
  },
  { timestamps: true },
);

const StarWarsSkillSchema = new Schema(
  {
    ...CatalogBase,
    keyAbility: {
      type: String,
      enum: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'],
      required: true,
    },
    trainedOnly: { type: Boolean, default: false },
    armorCheckPenalty: { type: Boolean, default: false },
    commonUses: { type: [String], default: [] },
  },
  { timestamps: true },
);

const StarWarsFeatSchema = new Schema(
  {
    ...CatalogBase,
    prerequisites: { type: [String], default: [] },
    benefit: { type: String, default: '' },
    normal: { type: String, default: '' },
    special: { type: String, default: '' },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

const StarWarsTalentSchema = new Schema(
  {
    ...CatalogBase,
    tree: { type: String, required: true },
    classRestriction: { type: [String], default: [] },
    forceTalent: { type: Boolean, default: false },
    prerequisites: { type: [String], default: [] },
    benefit: { type: String, default: '' },
  },
  { timestamps: true },
);

const StarWarsForcePowerSchema = new Schema(
  {
    ...CatalogBase,
    prerequisites: { type: [String], default: [] },
    activation: { type: String, default: '' },
    target: { type: String, default: '' },
    effect: { type: String, default: '' },
    special: { type: String, default: '' },
  },
  { timestamps: true },
);

const CommonCatalogSchema = new Schema(
  {
    ...CatalogBase,
    prerequisites: { type: [String], default: [] },
    rules: { type: String, default: '' },
  },
  { timestamps: true },
);

const StarWarsEquipmentSchema = new Schema(
  {
    ...CatalogBase,
    type: {
      type: String,
      enum: ['weapon', 'armor', 'generalEquipment', 'explosive', 'service', 'cybernetic', 'droidSystem', 'vehicle'],
      required: true,
      index: true,
    },
    cost: { type: String, default: '' },
    weight: { type: String, default: '' },
    availability: { type: String, default: '' },
    restriction: { type: String, default: '' },
    weapon: {
      weaponType: String,
      damage: String,
      damageType: String,
      rateOfFire: String,
      range: String,
      stun: Boolean,
      areaAttack: Boolean,
      proficiencyGroup: String,
      size: String,
    },
    armor: {
      armorType: String,
      reflexBonus: Number,
      fortitudeBonus: Number,
      maxDexBonus: Number,
      armorCheckPenalty: Number,
      speedPenalty: String,
    },
    generalEquipment: {
      category: String,
      rulesEffect: String,
    },
  },
  { timestamps: true },
);

const StarWarsVehicleSchema = new Schema(
  {
    ...CatalogBase,
    type: { type: String, required: true, index: true },
    size: { type: String, default: '' },
    initiative: { type: String, default: '' },
    defenses: { type: Schema.Types.Mixed, default: {} },
    hitPoints: { type: Number, default: null },
    damageThreshold: { type: Number, default: null },
    speed: { type: String, default: '' },
    weapons: { type: [Schema.Types.Mixed], default: [] },
    crew: { type: String, default: '' },
    passengers: { type: String, default: '' },
    cargo: { type: String, default: '' },
    consumables: { type: String, default: '' },
    cost: { type: String, default: '' },
    availability: { type: String, default: '' },
  },
  { timestamps: true },
);

const StarWarsDroidSystemSchema = new Schema(
  {
    ...CatalogBase,
    type: { type: String, default: '' },
    cost: { type: String, default: '' },
    rulesEffect: { type: String, default: '' },
  },
  { timestamps: true },
);

export type StarWarsSpeciesDocument = InferSchemaType<typeof StarWarsSpeciesSchema>;
export type StarWarsHeroicClassDocument = InferSchemaType<typeof StarWarsHeroicClassSchema>;
export type StarWarsPrestigeClassDocument = InferSchemaType<typeof StarWarsPrestigeClassSchema>;
export type StarWarsSkillDocument = InferSchemaType<typeof StarWarsSkillSchema>;
export type StarWarsFeatDocument = InferSchemaType<typeof StarWarsFeatSchema>;
export type StarWarsTalentDocument = InferSchemaType<typeof StarWarsTalentSchema>;
export type StarWarsForcePowerDocument = InferSchemaType<typeof StarWarsForcePowerSchema>;
export type StarWarsEquipmentDocument = InferSchemaType<typeof StarWarsEquipmentSchema>;
export type StarWarsVehicleDocument = InferSchemaType<typeof StarWarsVehicleSchema>;
export type StarWarsDroidSystemDocument = InferSchemaType<typeof StarWarsDroidSystemSchema>;

export const StarWarsSpeciesModel =
  models.StarWarsSpecies || model('StarWarsSpecies', StarWarsSpeciesSchema);
export const StarWarsHeroicClassModel =
  models.StarWarsHeroicClass || model('StarWarsHeroicClass', StarWarsHeroicClassSchema);
export const StarWarsPrestigeClassModel =
  models.StarWarsPrestigeClass || model('StarWarsPrestigeClass', StarWarsPrestigeClassSchema);
export const StarWarsSkillModel = models.StarWarsSkill || model('StarWarsSkill', StarWarsSkillSchema);
export const StarWarsFeatModel = models.StarWarsFeat || model('StarWarsFeat', StarWarsFeatSchema);
export const StarWarsTalentModel = models.StarWarsTalent || model('StarWarsTalent', StarWarsTalentSchema);
export const StarWarsForcePowerModel =
  models.StarWarsForcePower || model('StarWarsForcePower', StarWarsForcePowerSchema);
export const StarWarsForceTechniqueModel =
  models.StarWarsForceTechnique || model('StarWarsForceTechnique', CommonCatalogSchema);
export const StarWarsForceSecretModel =
  models.StarWarsForceSecret || model('StarWarsForceSecret', CommonCatalogSchema);
export const StarWarsForceTraditionModel =
  models.StarWarsForceTradition || model('StarWarsForceTradition', CommonCatalogSchema);
export const StarWarsEquipmentModel =
  models.StarWarsEquipment || model('StarWarsEquipment', StarWarsEquipmentSchema);
export const StarWarsVehicleModel = models.StarWarsVehicle || model('StarWarsVehicle', StarWarsVehicleSchema);
export const StarWarsDroidSystemModel =
  models.StarWarsDroidSystem || model('StarWarsDroidSystem', StarWarsDroidSystemSchema);
