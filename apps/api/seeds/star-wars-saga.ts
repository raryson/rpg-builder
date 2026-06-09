import { connectToDatabase } from '../lib/mongodb';
import {
  StarWarsDroidSystemModel,
  StarWarsEquipmentModel,
  StarWarsFeatModel,
  StarWarsForcePowerModel,
  StarWarsForceSecretModel,
  StarWarsForceTechniqueModel,
  StarWarsForceTraditionModel,
  StarWarsHeroicClassModel,
  StarWarsPrestigeClassModel,
  StarWarsSkillModel,
  StarWarsSpeciesModel,
  StarWarsTalentModel,
  StarWarsVehicleModel,
} from '../models/star-wars-saga-catalogs';

type CatalogModel = {
  updateOne(filter: object, update: object, options: object): Promise<unknown>;
};

async function upsertMany(model: CatalogModel, docs: Array<{ slug: string; name: string } & Record<string, unknown>>) {
  for (const doc of docs) {
    await model.updateOne({ slug: doc.slug }, { $set: doc }, { upsert: true });
  }
}

const emptyMods = {
  strength: 0,
  dexterity: 0,
  constitution: 0,
  intelligence: 0,
  wisdom: 0,
  charisma: 0,
};

export const starWarsSpeciesSeed = [
  {
    name: 'Humano',
    abilityModifiers: emptyMods,
    specialTraits: ['Pericia treinada extra no 1º nivel', 'Aptidao extra no 1º nivel'],
    automaticLanguages: ['Basica'],
    description: 'Versateis: recebem uma pericia treinada adicional e uma aptidao extra no 1º nivel.',
  },
  {
    name: 'Bothan',
    abilityModifiers: { ...emptyMods, dexterity: 2, constitution: -2 },
    defenseBonuses: { reflex: 0, fortitude: 0, will: 2 },
    specialTraits: ['Vontade de Ferro: +2 na Defesa de Vontade', 'Foco em Pericia (Obter Informacoes) se treinado'],
    automaticLanguages: ['Basica', 'Bothese'],
    description: '+2 Des, -2 Con; +2 especie em Vontade; foco condicional em Obter Informacoes.',
  },
  {
    name: 'Cereano',
    abilityModifiers: { ...emptyMods, dexterity: -2, intelligence: 2, wisdom: 2 },
    specialTraits: ['Iniciativa Intuitiva: pode refazer testes de Iniciativa', 'Foco em Pericia (Iniciativa) se treinado'],
    automaticLanguages: ['Basica', 'Cereana'],
    description: '+2 Int, +2 Sab, -2 Des; refaz Iniciativa e pode ganhar foco condicional.',
  },
  {
    name: 'Devaroniano',
    abilityModifiers: { ...emptyMods, dexterity: 2, wisdom: -2, charisma: -2 },
    specialTraits: [
      'Machos: +2 Des, -2 Sab, -2 Car; femeas: +2 Sab, -2 Des',
      'Foco em Pericia (Dissimulacao) se treinado',
      'Curiosidade Natural: bonus de intuicao +1 contra alvo observado',
    ],
    automaticLanguages: ['Basica', 'Devaroniana'],
    description: 'Padrao masculino aplicado automaticamente; ajuste feminino deve ser editado manualmente na ficha.',
  },
  {
    name: 'Duros',
    abilityModifiers: { ...emptyMods, dexterity: 2, constitution: -2, intelligence: 2 },
    specialTraits: ['Pilotos Experientes: pode refazer testes de Pilotar'],
    automaticLanguages: ['Basica', 'Duresa'],
    description: '+2 Des, +2 Int, -2 Con; refaz Pilotar.',
  },
  {
    name: 'Ewok',
    size: 'Pequeno',
    speed: 4,
    abilityModifiers: { ...emptyMods, strength: -2, dexterity: 2 },
    defenseBonuses: { reflex: 1, fortitude: 0, will: 0 },
    skillBonuses: { furtividade: 5 },
    specialTraits: ['Pequeno: +1 Reflexos e +5 Furtividade', 'Primitivo', 'Olfato', 'Refaz Furtividade', 'Foco em Pericia (Sobrevivencia) se treinado'],
    automaticLanguages: ['Ewokes'],
    description: '+2 Des, -2 For; tamanho Pequeno, deslocamento 4, +1 Reflexos e +5 Furtividade.',
  },
  {
    name: 'Gamorreano',
    abilityModifiers: { ...emptyMods, strength: 2, dexterity: -2, intelligence: -2 },
    defenseBonuses: { reflex: 0, fortitude: 2, will: 0 },
    specialTraits: ['Primitivo', 'Grande Fortitude: +2 Fortitude', 'Limite de Dano Aprimorado como aptidao bonus'],
    automaticLanguages: ['Basica (compreende)', 'Gamorreana'],
    description: '+2 For, -2 Des, -2 Int; +2 especie em Fortitude; recebe Limite de Dano Aprimorado.',
  },
  {
    name: 'Gungan',
    abilityModifiers: { ...emptyMods, dexterity: 2, intelligence: -2, charisma: -2 },
    specialTraits: ['Deslocamento de nado 4', 'Nadador Experiente', 'Prender respiracao'],
    automaticLanguages: ['Basica', 'Gunganesa'],
    description: '+2 Des, -2 Int, -2 Car; deslocamento 6 e nado 4.',
  },
  {
    name: 'Ithoriano',
    abilityModifiers: { ...emptyMods, dexterity: -2, wisdom: 2, charisma: 2 },
    defenseBonuses: { reflex: 0, fortitude: 0, will: 2 },
    specialTraits: ['Vontade de Ferro: +2 Vontade', 'Urrar', 'Refaz Sobrevivencia', 'Foco em Conhecimento (Ciencias da Vida) se treinado'],
    automaticLanguages: ['Basica', 'Ithoriana'],
    description: '+2 Sab, +2 Car, -2 Des; +2 especie em Vontade.',
  },
  {
    name: 'Kel Dor',
    abilityModifiers: { ...emptyMods, dexterity: 2, constitution: -2, wisdom: 2 },
    specialTraits: ['Senso Apurado da Forca', 'Visao na Penumbra', 'Equipamento especial obrigatorio'],
    automaticLanguages: ['Basica', 'Kel Dor'],
    description: '+2 Des, +2 Sab, -2 Con; refaz certos usos de Usar a Forca.',
  },
  {
    name: 'Mon Calamariano',
    abilityModifiers: { ...emptyMods, constitution: -2, intelligence: 2, wisdom: 2 },
    specialTraits: ['Anfibio', 'Deslocamento de nado 4', 'Nadador Experiente'],
    automaticLanguages: ['Basica', 'Mon Calamariana'],
    description: '+2 Int, +2 Sab, -2 Con; anfibio e nado 4.',
  },
  {
    name: 'Quarren',
    abilityModifiers: { ...emptyMods, constitution: 2, wisdom: -2, charisma: -2 },
    specialTraits: ['Aquatico', 'Deslocamento de nado 4', 'Nadador Experiente', 'Visao na Penumbra', 'Foco em Pericia (Persuasao) se treinado'],
    automaticLanguages: ['Basica', 'Quarrenesa'],
    description: '+2 Con, -2 Sab, -2 Car; aquatico e nado 4.',
  },
  {
    name: 'Rodiano',
    abilityModifiers: { ...emptyMods, dexterity: 2, wisdom: -2, charisma: -2 },
    specialTraits: ['Cacador nato; tracos raciais descritos na secao dos rodianos'],
    automaticLanguages: ['Basica', 'Rodesa'],
    description: '+2 Des, -2 Sab, -2 Car.',
  },
  {
    name: 'Sullustano',
    abilityModifiers: { ...emptyMods, dexterity: 2, constitution: -2 },
    specialTraits: ['Ver no Escuro', 'Escolhe 10 em Escalar', 'Refaz Percepcao'],
    automaticLanguages: ['Basica', 'Sullustesa'],
    description: '+2 Des, -2 Con; visao no escuro e refaz Percepcao.',
  },
  {
    name: 'Trandoshano',
    abilityModifiers: { ...emptyMods, strength: 2, dexterity: -2 },
    defenseBonuses: { reflex: 1, fortitude: 0, will: 0 },
    specialTraits: ['Ver no Escuro', 'Regeneracao de Membros', 'Armadura Natural: +1 Reflexos', 'Vigoroso como aptidao bonus'],
    automaticLanguages: ['Basica', 'Dosh'],
    description: '+2 For, -2 Des; armadura natural +1 Reflexos.',
  },
  {
    name: "Twi'lek",
    abilityModifiers: { ...emptyMods, wisdom: -2, charisma: 2 },
    specialTraits: ['Comunicacao por lekku', 'Tracos sociais descritos na secao twi’lek'],
    automaticLanguages: ['Basica', 'Ryl'],
    description: '+2 Car, -2 Sab.',
  },
  {
    name: 'Wookiee',
    abilityModifiers: { ...emptyMods, strength: 4, dexterity: -2, constitution: 2, wisdom: -2, charisma: -2 },
    specialTraits: ['Recuperacao Extraordinaria', 'Furia', 'Familiaridade com besta energetica', 'Escolhe 10 em Escalar', 'Refaz Persuasao para intimidar'],
    automaticLanguages: ['Basica (compreende)', 'Shyriiwook'],
    description: '+4 For, +2 Con, -2 Des, -2 Sab, -2 Car; furia e recuperacao extraordinaria.',
  },
  {
    name: 'Zabrak',
    abilityModifiers: emptyMods,
    specialTraits: ['Resiliencia e sobrevivencia descritas na secao zabrak'],
    automaticLanguages: ['Basica', 'Zabrak'],
    description: 'Sem ajustes de habilidade na Tabela 2-1; tracos raciais descritos no capitulo de especies.',
  },
].map((doc) => ({
  slug: slugify(doc.name),
  size: 'Medio',
  speed: 6,
  defenseBonuses: { reflex: 0, fortitude: 0, will: 0 },
  skillBonuses: {},
  conditionalBonusFeats: [],
  bonusLanguages: [],
  sourcePage: 28,
  ...doc,
}));

export const starWarsHeroicClassesSeed = [
  {
    name: 'Jedi',
    slug: 'jedi',
    hitDie: 'd10',
    startingHitPoints: 30,
    trainedSkills: ['usar-a-forca'],
    defenseBonuses: { reflex: 1, fortitude: 1, will: 1 },
    startingFeats: ['sensivel-a-forca', 'proficiencia-em-armas-exoticas-sabre-de-luz', 'proficiencia-em-armas-armas-simples'],
    description: '+1 Reflexos, +1 Fortitude, +1 Vontade; PV inicial 30 + Con; BBA completo.',
  },
  {
    name: 'Nobre',
    slug: 'nobre',
    hitDie: 'd6',
    startingHitPoints: 18,
    trainedSkills: [],
    defenseBonuses: { reflex: 1, fortitude: 0, will: 2 },
    startingFeats: ['linguista', 'proficiencia-em-armas-pistolas', 'proficiencia-em-armas-armas-simples'],
    description: '+1 Reflexos, +2 Vontade; PV inicial 18 + Con; BBA 3/4.',
  },
  {
    name: 'Fora-da-Lei',
    slug: 'fora-da-lei',
    hitDie: 'd6',
    startingHitPoints: 18,
    trainedSkills: [],
    defenseBonuses: { reflex: 2, fortitude: 0, will: 1 },
    startingFeats: ['tiro-a-queima-roupa', 'proficiencia-em-armas-pistolas', 'proficiencia-em-armas-armas-simples'],
    description: '+2 Reflexos, +1 Vontade; PV inicial 18 + Con; BBA 3/4.',
  },
  {
    name: 'Batedor',
    slug: 'batedor',
    hitDie: 'd8',
    startingHitPoints: 24,
    trainedSkills: [],
    defenseBonuses: { reflex: 2, fortitude: 1, will: 0 },
    startingFeats: ['recuperacao-rapida', 'proficiencia-em-armas-pistolas', 'proficiencia-em-armas-rifles', 'proficiencia-em-armas-armas-simples'],
    description: '+2 Reflexos, +1 Fortitude; PV inicial 24 + Con; BBA 3/4.',
  },
  {
    name: 'Soldado',
    slug: 'soldado',
    hitDie: 'd10',
    startingHitPoints: 30,
    trainedSkills: [],
    defenseBonuses: { reflex: 1, fortitude: 2, will: 0 },
    startingFeats: [
      'proficiencia-em-armas-armas-simples',
      'proficiencia-em-armas-pistolas',
      'proficiencia-em-armas-rifles',
      'proficiencia-em-armaduras-leve',
      'proficiencia-em-armaduras-media',
    ],
    description: '+1 Reflexos, +2 Fortitude; PV inicial 30 + Con; BBA completo.',
  },
].map((doc) => ({
  ...doc,
  baseAttackBonusProgression: doc.slug === 'jedi' || doc.slug === 'soldado' ? 'full' : 'three-quarters',
  talentTrees: [],
  classFeatures: [],
  credits: '',
  sourcePage: 37,
}));

export const starWarsPrestigeClassesSeed = [
  'As da Pilotagem',
  'Cacador de Recompensas',
  'Senhor do Crime',
  'Soldado de Elite',
  'Adepto da Forca',
  'Discipulo da Forca',
  'Pistoleiro',
  'Cavaleiro Jedi',
  'Mestre Jedi',
  'Oficial',
  'Aprendiz Sith',
  'Lorde Sith',
].map((name) => ({
  name,
  slug: slugify(name),
  prerequisites: [],
  hitDie: 'd8',
  baseAttackBonusProgression: 'full',
  defenseBonuses: { reflex: 0, fortitude: 0, will: 0 },
  talentTrees: [],
  classFeatures: [],
  sourcePage: 222,
  description: 'Classe de prestigio do Livro Basico Revisado; pre-requisitos devem ser preenchidos pelo catalogo expandido.',
}));

const skillSeedRows: Array<[string, string, boolean, boolean]> = [
  ['Acrobacia', 'dexterity', false, true],
  ['Conhecimento', 'intelligence', true, false],
  ['Dissimulação', 'charisma', false, false],
  ['Escalar', 'strength', false, true],
  ['Furtividade', 'dexterity', false, true],
  ['Iniciativa', 'dexterity', false, false],
  ['Mecânica', 'intelligence', true, false],
  ['Montar', 'dexterity', false, true],
  ['Nadar', 'strength', false, true],
  ['Obter Informações', 'charisma', false, false],
  ['Percepção', 'wisdom', false, false],
  ['Persuasão', 'charisma', false, false],
  ['Pilotar', 'dexterity', false, false],
  ['Saltar', 'strength', false, true],
  ['Sobrevivência', 'wisdom', false, false],
  ['Tratar Ferimentos', 'wisdom', false, false],
  ['Usar Computador', 'intelligence', false, false],
  ['Usar a Força', 'charisma', true, false],
];

export const starWarsSkillsSeed = skillSeedRows.map(([name, keyAbility, trainedOnly, armorCheckPenalty]) => ({
  name,
  slug: slugify(String(name)),
  keyAbility,
  trainedOnly,
  armorCheckPenalty,
  commonUses: [],
  sourcePage: 67,
  description: 'Pericia do capitulo IV do Livro Basico Revisado.',
}));

export const starWarsFeatsSeed = [
  'Acuidade com Arma',
  'Arremessar',
  'Artes Marciais I',
  'Artes Marciais II',
  'Artes Marciais III',
  'Ataque Acrobatico',
  'Ataque Coordenado',
  'Ataque Duplo',
  'Ataque em Movimento',
  'Ataque Giratorio',
  'Ataque Poderoso',
  'Ataque Rapido',
  'Cirurgia Cibernetica',
  'Combate Veicular',
  'Critico Triplicado',
  'Defesa Corpo a Corpo',
  'Derrubar',
  'Desarmar',
  'Encontrão',
  'Especialista Cirurgico',
  'Especialista Tecnico',
  'Esquiva',
  'Esmagar',
  'Foco em Arma',
  'Foco em Pericia',
  'Foco na Forca',
  'Franco Atirador',
  'Furia Assustadora',
  'Furia Extra',
  'Imobilizar',
  'Impulso Eficaz',
  'Investida Aprimorada',
  'Investida Poderosa',
  'Limite de Dano Aprimorado',
  'Linguista',
  'Maestria com Duas Armas I',
  'Maestria com Duas Armas II',
  'Maestria com Duas Armas III',
  'Mobilidade',
  'Poderoso na Forca',
  'Proficiência com Armas',
  'Proficiência com Armaduras',
  'Saque Rapido',
  'Sensitivo a Forca',
  'Tiro a Queima Roupa',
  'Tiro Longo',
  'Tiro Preciso',
  'Tiro Rapido',
  'Treinamento na Forca',
  'Trespassar',
].map((name) => ({
  name,
  slug: slugify(name),
  prerequisites: [],
  benefit: '',
  normal: '',
  special: '',
  tags: [],
  sourcePage: 87,
  description: 'Aptidao do capitulo V; regras detalhadas devem ser transcritas do manual.',
}));

export const starWarsForcePowersSeed = [
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
].map((name) => ({
  name,
  slug: slugify(name),
  prerequisites: [],
  activation: '',
  target: '',
  effect: '',
  special: '',
  sourcePage: 105,
  description: 'Poder da Forca do capitulo VI do Livro Basico Revisado.',
}));

const talentSeedRows: Array<[string, string, string[], boolean]> = [
  ['Bloqueio', 'combate-com-sabre-de-luz', ['jedi'], false],
  ['Deflexão', 'combate-com-sabre-de-luz', ['jedi'], false],
  ['Equilibrio', 'controle', ['jedi'], true],
  ['Foco da Forca', 'controle', ['jedi'], true],
  ['Poder do Lado Negro', 'lado-negro', [], true],
  ['Presenca Sombria', 'lado-negro', [], true],
  ['Vinganca', 'lado-negro', [], true],
  ['Sentidos Agudos', 'consciencia', ['batedor'], false],
  ['Iniciativa Aprimorada', 'consciencia', ['batedor'], false],
  ['Inspirar Confianca', 'lideranca', ['nobre'], false],
  ['Ataque Furtivo', 'infortunio', ['fora-da-lei'], false],
  ['Especialista em Armadura', 'especialista-em-armadura', ['soldado'], false],
];

export const starWarsTalentsSeed = talentSeedRows.map(([name, tree, classRestriction, forceTalent]) => ({
  name,
  slug: slugify(String(name)),
  tree,
  classRestriction,
  forceTalent,
  prerequisites: [],
  benefit: '',
  sourcePage: 40,
  description: 'Talento inicial de catalogo; expandir por arvore conforme o manual.',
}));

const equipmentSeedRows: Array<[string, string]> = [
  ['Sabre de luz', 'weapon'],
  ['Pistola blaster', 'weapon'],
  ['Rifle blaster', 'weapon'],
  ['Granada de fragmentacao', 'explosive'],
  ['Armadura de combate', 'armor'],
  ['Traje de voo', 'armor'],
  ['Kit de ferramentas', 'generalEquipment'],
  ['Medpac', 'generalEquipment'],
  ['Comlink', 'generalEquipment'],
  ['Computador portatil', 'generalEquipment'],
  ['Proteses ciberneticas', 'cybernetic'],
];

export const starWarsEquipmentSeed = equipmentSeedRows.map(([name, type]) => ({
  name,
  slug: slugify(name),
  type,
  cost: '',
  weight: '',
  availability: '',
  restriction: '',
  sourcePage: 120,
  description: 'Equipamento inicial selecionavel; valores completos devem ser transcritos das tabelas do manual.',
}));

export const starWarsVehiclesSeed = [
  'X-wing',
  'TIE Fighter',
  'Y-wing',
  'Millennium Falcon',
  'Speeder bike',
  'AT-ST',
].map((name) => ({
  name,
  slug: slugify(name),
  type: 'vehicle',
  size: '',
  initiative: '',
  defenses: {},
  speed: '',
  weapons: [],
  crew: '',
  passengers: '',
  cargo: '',
  consumables: '',
  cost: '',
  availability: '',
  sourcePage: 201,
  description: 'Veiculo inicial selecionavel; estatisticas completas pertencem ao capitulo X.',
}));

export const starWarsDroidSystemsSeed = [
  'Locomocao por rodas',
  'Locomocao por pes',
  'Locomocao por esteiras',
  'Locomocao voadora',
  'Processador heuristicos',
  'Processador remoto',
  'Apêndice manipulador',
  'Sonda sensorial',
].map((name) => ({
  name,
  slug: slugify(name),
  type: 'droidSystem',
  cost: '',
  rulesEffect: '',
  sourcePage: 137,
  description: 'Sistema de droide inicial selecionavel; completar custo e regras pelas tabelas do manual.',
}));

export const starWarsForceTechniquesSeed = [
  'Recuperar Ponto da Forca',
  'Mestria com Poder da Forca',
  'Transe da Forca Aprimorado',
  'Mover Objetos Leves Aprimorado',
  'Sentir a Forca Aprimorado',
  'Sentir os Arredores Aprimorado',
  'Telepatia Aprimorada',
].map((name) => ({ name, slug: slugify(name), prerequisites: [], rules: '', sourcePage: 112, description: '' }));

export const starWarsForceSecretsSeed = ['Poder Devastador', 'Poder Multialvo', 'Poder Rapido'].map((name) => ({
  name,
  slug: slugify(name),
  prerequisites: [],
  rules: '',
  sourcePage: 113,
  description: '',
}));

export const starWarsForceTraditionsSeed = ['Jedi', 'Sith', 'Bruxas de Dathomir', 'Jensaarai'].map((name) => ({
  name,
  slug: slugify(name),
  prerequisites: [],
  rules: '',
  sourcePage: 105,
  description: '',
}));

export async function seedStarWarsSpecies() {
  await upsertMany(StarWarsSpeciesModel, starWarsSpeciesSeed);
}

export async function seedStarWarsClasses() {
  await upsertMany(StarWarsHeroicClassModel, starWarsHeroicClassesSeed);
  await upsertMany(StarWarsPrestigeClassModel, starWarsPrestigeClassesSeed);
}

export async function seedStarWarsSkills() {
  await upsertMany(StarWarsSkillModel, starWarsSkillsSeed);
}

export async function seedStarWarsFeats() {
  await upsertMany(StarWarsFeatModel, starWarsFeatsSeed);
}

export async function seedStarWarsTalents() {
  await upsertMany(StarWarsTalentModel, starWarsTalentsSeed);
}

export async function seedStarWarsForcePowers() {
  await upsertMany(StarWarsForcePowerModel, starWarsForcePowersSeed);
  await upsertMany(StarWarsForceTechniqueModel, starWarsForceTechniquesSeed);
  await upsertMany(StarWarsForceSecretModel, starWarsForceSecretsSeed);
  await upsertMany(StarWarsForceTraditionModel, starWarsForceTraditionsSeed);
}

export async function seedStarWarsEquipment() {
  await upsertMany(StarWarsEquipmentModel, starWarsEquipmentSeed);
}

export async function seedStarWarsVehicles() {
  await upsertMany(StarWarsVehicleModel, starWarsVehiclesSeed);
}

export async function seedStarWarsDroidSystems() {
  await upsertMany(StarWarsDroidSystemModel, starWarsDroidSystemsSeed);
}

export async function seedStarWarsSagaCatalogs() {
  await connectToDatabase();
  await seedStarWarsSpecies();
  await seedStarWarsClasses();
  await seedStarWarsSkills();
  await seedStarWarsFeats();
  await seedStarWarsTalents();
  await seedStarWarsForcePowers();
  await seedStarWarsEquipment();
  await seedStarWarsVehicles();
  await seedStarWarsDroidSystems();
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
